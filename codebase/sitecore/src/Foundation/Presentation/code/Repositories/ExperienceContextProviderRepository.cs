using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Mvc.Common;

namespace easyJet.Foundation.Presentation.Repositories
{
    /// <summary>
    /// Repository for Experience Context Providers.
    /// Wraps active-provider and verbose-logging reads in <see cref="IHtmlCacheRepository"/> via GetOrAdd
    /// so repeated requests are served from cache without hitting the Sitecore database.
    /// </summary>
    [Service(typeof(IExperienceContextProviderRepository), Lifetime = Lifetime.Singleton)]
    public class ExperienceContextProviderRepository : IExperienceContextProviderRepository
    {
        private const string CacheKeyActiveProviders = "easyJet.Foundation.Presentation.Cache.ActiveProviders";
        private const string CacheKeyVerboseLogging = "easyJet.Foundation.Presentation.Cache.VerboseLogging";
        private const string JustRemoveValue = "JUST_REMOVE";
        private readonly IPresentationLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IFieldUtilsService fieldUtilsService;
        private readonly IHtmlCacheRepository htmlCacheRepository;

        /// <summary>
        /// Initializes a new instance of the <see cref="ExperienceContextProviderRepository"/> class.
        /// </summary>
        /// <param name="pdatabaseProvider">Provider for database access.</param>
        /// <param name="plogger">Logger for diagnostic output.</param>
        /// <param name="pcontextProvider">Provider for current Sitecore context (unused; retained for DI compatibility).</param>
        /// <param name="pHtmlCacheRepository">HTML cache repository used for caching provider data.</param>
        /// <param name="fieldUtils">Provider for field utilities; if null, uses FieldUtilsAdapter.</param>
        public ExperienceContextProviderRepository(IDatabaseProvider pdatabaseProvider, IPresentationLogger plogger, ISitecoreContextProvider pcontextProvider, IHtmlCacheRepository pHtmlCacheRepository, IFieldUtilsService fieldUtils = null)
        {
            logger = plogger;
            databaseProvider = pdatabaseProvider;
            htmlCacheRepository = pHtmlCacheRepository;
            fieldUtilsService = fieldUtils;
        }

        /// <summary>
        /// Gets the active provider page rules for the specified provider identifier that match the current page template.
        /// Returns an empty collection if provider not found or has no active page rules.
        /// </summary>
        /// <param name="providerIdentifier">The unique identifier of the provider.</param>
        /// <returns>Collection of active page rules for the provider matching the current context.</returns>
        public virtual IReadOnlyCollection<ExperienceContextProviderPageRule> GetActiveProviderPages(string providerIdentifier, ID contextItemId)
        {
            var providers = GetActiveProviders();
            if (providers == null || providers.Count == 0)
            {
                return Array.Empty<ExperienceContextProviderPageRule>();
            }

            var matchingProviders = providers.Where(p => string.Equals(p.Identifier, providerIdentifier, StringComparison.OrdinalIgnoreCase)).ToList();
            if (!matchingProviders.Any())
            {
                return Array.Empty<ExperienceContextProviderPageRule>();
            }

            return matchingProviders.SelectMany(i => i.Pages).Where(i => MatchesContextItem(i, contextItemId)).ToList();
        }

        /// <summary>
        /// Determines whether the specified provider is active for the given page.
        /// </summary>
        /// <param name="identifier">The unique identifier of the provider.</param>
        /// <param name="pageId">The Sitecore item ID of the page to check.</param>
        /// <returns>True if the provider is active and has rules matching the page template; otherwise false.</returns>
        public virtual bool IsProviderActiveForPage(string identifier, ID pageId)
        {
            if (string.IsNullOrWhiteSpace(identifier) || pageId.IsNull)
            {
                return false;
            }

            var pageDatabase = databaseProvider.GetDatabase(DatabaseType.Context);
            if (pageDatabase == null)
            {
                return false;
            }

            var pageItem = pageDatabase.GetItem(pageId);
            if (pageItem == null)
            {
                return false;
            }

            var provider = GetActiveProvider(identifier);
            if (provider == null || provider.Pages == null || provider.Pages.Count == 0)
            {
                return false;
            }

            return provider.Pages.Any(rule => rule.IsTemplateBased
                ? rule.PageItemId.Equals(pageItem.TemplateID)
                : rule.PageItemId.Equals(pageItem.ID));
        }

        /// <summary>
        /// Determines whether verbose logging is enabled. Result is cached via <see cref="IHtmlCacheRepository"/>.
        /// </summary>
        /// <returns>True if verbose logging is enabled; otherwise false.</returns>
        public virtual bool IsVerboseLoggingEnabled()
        {
            var cached = htmlCacheRepository.GetOrAdd(
                CacheKeyVerboseLogging,
                () => new CachedBool(FetchIsVerboseLoggingEnabled()));
            return cached?.Value ?? false;
        }

        public virtual IEnumerable<string> GetProviders()
        {
            var activeProviders = GetActiveProviders();
            return activeProviders?.Select(p => p.Identifier) ?? Enumerable.Empty<string>();
        }

        /// <summary>
        /// Gets the active provider configuration matching the specified identifier.
        /// Returns null if provider not found or not active.
        /// </summary>
        /// <param name="providerIdentifier">The unique identifier of the provider to retrieve.</param>
        /// <returns>The provider configuration if found and active; otherwise null.</returns>
        public virtual ExperienceContextProviderConfig GetActiveProvider(string providerIdentifier)
        {
            if (string.IsNullOrWhiteSpace(providerIdentifier))
            {
                return null;
            }

            var providers = GetActiveProviders();
            if (providers == null || providers.Count == 0)
            {
                return null;
            }

            return providers.FirstOrDefault(p => string.Equals(p.Identifier, providerIdentifier, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Gets the Sitecore item ID of the provider with the specified identifier.
        /// </summary>
        /// <param name="identifier">The unique identifier of the provider.</param>
        /// <returns>The item ID of the provider, or ID.Null if not found.</returns>
        public virtual ID GetProviderItemId(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return ID.Null;
            }

            var providerDatabase = databaseProvider.GetDatabase(DatabaseType.Context);
            var repositoryRoot = GetSettingsRoot(providerDatabase);
            if (repositoryRoot == null)
            {
                return ID.Null;
            }

            var providerItems = fieldUtilsService.GetMultilistTargetItems(Constants.Fields.ExperienceContextProviders.ActiveProviders, repositoryRoot);
            if (providerItems == null || providerItems.Length == 0)
            {
                return ID.Null;
            }

            var matchingItem = providerItems.FirstOrDefault(item =>
            {
                if (item == null || item.TemplateID != Constants.TemplateIds.ExperienceContextProvider)
                {
                    return false;
                }

                var itemIdentifier = item[Constants.Fields.ExperienceContextProvider.Identifier];
                return string.Equals(itemIdentifier, identifier, StringComparison.OrdinalIgnoreCase);
            });

            return matchingItem?.ID ?? ID.Null;
        }

        public virtual ExperienceContextProviderPageRule GetRuleForItem(ID ruleItemId)
        {
            if (ID.IsNullOrEmpty(ruleItemId))
            {
                return null;
            }

            var db = databaseProvider.GetDatabase(DatabaseType.Master);
            if (db == null)
            {
                return null;
            }

            var item = db.GetItem(ruleItemId);
            return item == null ? null : BuildPageRule(item);
        }

        public bool IsValidIdentifier(string identifier)
        {
            return GetProviders().Any(p => string.Equals(p, identifier, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Reads the verbose-logging flag directly from the Sitecore database (no cache).
        /// </summary>
        /// <returns>True if verbose logging is enabled; otherwise false.</returns>
        protected bool FetchIsVerboseLoggingEnabled()
        {
            try
            {
                var repositoryRoot = GetSettingsRoot(databaseProvider.GetDatabase(DatabaseType.Context));
                if (repositoryRoot == null)
                {
                    return false;
                }

                var field = repositoryRoot.Fields[Constants.Fields.ExperienceContextProvidersSettings.EnableVerboseLogging];
                if (field == null)
                {
                    return false;
                }

                var checkboxField = new CheckboxField(field);
                return checkboxField.Checked;
            }
            catch (Exception e)
            {
                logger.Error($"{nameof(FetchIsVerboseLoggingEnabled)} has thrown an exception in {nameof(ExperienceContextProviderRepository)}", e, this);
                return false;
            }
        }

        /// <summary>
        /// Gets all active Experience Context Provider configurations, served from cache via <see cref="IHtmlCacheRepository"/>.
        /// </summary>
        /// <returns>Collection of active provider configurations, or an empty collection if none are available.</returns>
        protected virtual IReadOnlyCollection<ExperienceContextProviderConfig> GetActiveProviders()
        {
            return htmlCacheRepository.GetOrAdd(
                CacheKeyActiveProviders,
                FetchActiveProviders);
        }

        /// <summary>
        /// Reads all active Experience Context Provider configurations directly from the Sitecore database (no cache).
        /// </summary>
        /// <returns>Collection of active provider configurations, or an empty collection if none are available.</returns>
        protected IReadOnlyCollection<ExperienceContextProviderConfig> FetchActiveProviders()
        {
            var activeProviderDatabase = databaseProvider.GetDatabase(DatabaseType.Context);
            if (activeProviderDatabase == null)
            {
                logger.Warn($"database is not available!", GetType());
                return Array.Empty<ExperienceContextProviderConfig>();
            }

            var repositoryRoot = GetSettingsRoot(activeProviderDatabase);
            if (repositoryRoot == null)
            {
                logger.Warn($"{nameof(repositoryRoot)}  not found!", GetType());
                return Array.Empty<ExperienceContextProviderConfig>();
            }

            var field = repositoryRoot.Fields[Constants.Fields.ExperienceContextProviders.ActiveProviders];
            if (field == null)
            {
                logger.Warn($"ActiveProviders field ({Constants.Fields.ExperienceContextProviders.ActiveProviders}) not found on item: {repositoryRoot.Uri} !", GetType());
                return Array.Empty<ExperienceContextProviderConfig>();
            }

            // Use the ID-based overload to avoid relying on Field.Name being populated by test fakes
            return fieldUtilsService.GetMultilistTargetItems(Constants.Fields.ExperienceContextProviders.ActiveProviders, repositoryRoot)
                .Select(BuildProvider)
                .Where(config => config != null)
                .ToList();
        }

        private static List<RenderingMapping> ParseRenderingMappings(string fieldValue)
        {
            var mappings = new List<RenderingMapping>();
            if (string.IsNullOrWhiteSpace(fieldValue))
            {
                return mappings;
            }

            foreach (var entry in fieldValue.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = entry.Split(new[] { ':' }, 4);
                if (parts.Length < 2 || !ID.TryParse(parts[0], out var keyId))
                {
                    continue;
                }

                var isJustRemove = string.Equals(parts[1], JustRemoveValue, StringComparison.OrdinalIgnoreCase);
                ID.TryParse(isJustRemove ? string.Empty : parts[1], out var valueId);
                var parameters = parts.Length > 2 ? parts[2].Replace("<PIPE>", "|").Replace("<COLON>", ":") : string.Empty;
                Guid.TryParse(parts.Length > 3 ? parts[3] : string.Empty, out var uid);
                var mapping = new RenderingMapping(keyId, valueId, parameters, uid, isJustRemove);
                if (mapping.IsValid)
                {
                    mappings.Add(mapping);
                }
            }

            return mappings;
        }

        private static Item GetSettingsRoot(Database db)
            => db?.GetItem(Constants.ItemIds.ExperienceContextProvidersSettingsRoot);

        private ExperienceContextProviderPageRule BuildPageRule(Item pageItem)
        {
            if (pageItem == null)
            {
                return null;
            }

            if (pageItem.TemplateID == Constants.TemplateIds.ExperienceContextProviderPage)
            {
                return BuildPageBasedRule(pageItem);
            }

            if (pageItem.TemplateID == Constants.TemplateIds.ExperienceContextProviderPageTemplate)
            {
                return BuildTemplateBasedRule(pageItem);
            }

            return null;
        }

        private ExperienceContextProviderPageRule BuildPageBasedRule(Item pageItem)
        {
            var pageItemFieldValue = pageItem[Constants.Fields.ExperienceContextProviderPage.Page];
            if (!ID.TryParse(pageItemFieldValue, out var pageItemId) || pageItemId.IsNull)
            {
                return null;
            }

            var allowedRenderings = fieldUtilsService.GetMultilistTargetIds(Constants.Fields.ExperienceContextProviderPage.AllowedRenderings, pageItem) ?? Array.Empty<ID>();
            var replacementsField = pageItem.Fields[Constants.Fields.ExperienceContextProviderPage.RenderingReplacements];
            var replacements = ParseRenderingMappings(replacementsField?.Value);

            return new ExperienceContextProviderPageRule(pageItemId, allowedRenderings, replacements, isTemplateBased: false);
        }

        private ExperienceContextProviderPageRule BuildTemplateBasedRule(Item pageItem)
        {
            var templateFieldValue = pageItem[Constants.Fields.ExperienceContextProviderPageTemplate.PageTemplate];
            if (!ID.TryParse(templateFieldValue, out var templateId) || templateId.IsNull)
            {
                return null;
            }

            var allowedRenderings = fieldUtilsService.GetMultilistTargetIds(Constants.Fields.ExperienceContextProviderPageTemplate.AllowedRenderings, pageItem) ?? Array.Empty<ID>();
            var replacementsField = pageItem.Fields[Constants.Fields.ExperienceContextProviderPageTemplate.RenderingReplacements];
            var replacements = ParseRenderingMappings(replacementsField?.Value);

            return new ExperienceContextProviderPageRule(templateId, allowedRenderings, replacements, isTemplateBased: true);
        }

        private bool MatchesContextItem(ExperienceContextProviderPageRule rule, ID contextItemId)
        {
            if (rule.IsTemplateBased)
            {
                return MatchesContextItemTemplate(rule.PageItemId, contextItemId);
            }

            return rule.PageItemId.Equals(contextItemId);
        }

        private bool MatchesContextItemTemplate(ID templateId, ID contextItemId)
        {
            if (ID.IsNullOrEmpty(templateId) || ID.IsNullOrEmpty(contextItemId))
            {
                return false;
            }

            var db = databaseProvider.GetDatabase(DatabaseType.Context);
            var contextItem = db?.GetItem(contextItemId);
            return contextItem != null && contextItem.TemplateID.Equals(templateId);
        }

        private ExperienceContextProviderConfig BuildProvider(Item providerItem)
        {
            if (providerItem == null || providerItem.TemplateID != Constants.TemplateIds.ExperienceContextProvider)
            {
                return null;
            }

            var identifier = providerItem[Constants.Fields.ExperienceContextProvider.Identifier];
            if (string.IsNullOrWhiteSpace(identifier))
            {
                return null;
            }

            var pageItems = fieldUtilsService.GetMultilistTargetItems(Constants.Fields.ExperienceContextProvider.Pages, providerItem);
            if (pageItems == null || pageItems.Length == 0)
            {
                return null;
            }

            // Keep every valid rule — membership in the provider is independent of whether the rule carries
            // rendering surgery. Rules without renderings still activate the provider's page design (chrome); the
            // rendering-replacement pipeline (ApplyExperienceContextProviders) filters HasRules at apply time.
            var pageRules = pageItems
                .Select(BuildPageRule)
                .Where(rule => rule != null)
                .ToArray();

            if (pageRules.Length == 0)
            {
                return null;
            }

            return new ExperienceContextProviderConfig(identifier.Trim(), pageRules);
        }

        private sealed class CachedBool
        {
            public CachedBool(bool value) => Value = value;

            public bool Value { get; }
        }
    }
}
