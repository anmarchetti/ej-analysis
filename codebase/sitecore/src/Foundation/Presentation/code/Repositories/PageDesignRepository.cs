using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.Presentation.Logging;
using easyJet.Foundation.Presentation.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Repositories
{
    /// <summary>
    /// Resolves the page designs applicable to a content item.
    /// The candidate pool (all page designs under the item's site "Presentation/Page Designs" folder) is read
    /// once and cached via <see cref="IHtmlCacheRepository"/>; matching/grouping then runs in-memory per item.
    /// </summary>
    [Service(typeof(IPageDesignRepository), Lifetime = Lifetime.Singleton)]
    public class PageDesignRepository : IPageDesignRepository
    {
        private const string CacheKeyPoolPrefix = "easyJet.Foundation.Presentation.Cache.PageDesignPool";

        private readonly IHtmlCacheRepository htmlCacheRepository;
        private readonly IFieldUtilsService fieldUtilsService;
        private readonly IExperienceContextProviderRepository experienceContextProviderRepository;
        private readonly IPresentationLogger logger;

        public PageDesignRepository(
            IHtmlCacheRepository pHtmlCacheRepository,
            IFieldUtilsService pFieldUtils,
            IExperienceContextProviderRepository pExperienceContextProviderRepository,
            IPresentationLogger pLogger)
        {
            htmlCacheRepository = pHtmlCacheRepository;
            fieldUtilsService = pFieldUtils;
            experienceContextProviderRepository = pExperienceContextProviderRepository;
            logger = pLogger;
        }

        /// <inheritdoc/>
        public virtual IReadOnlyList<PageDesignMatch> GetMatchingPageDesigns(Item item)
        {
            if (item == null)
            {
                return Array.Empty<PageDesignMatch>();
            }

            var designsFolder = GetPageDesignsFolder(item);
            if (designsFolder == null)
            {
                return Array.Empty<PageDesignMatch>();
            }

            var pool = GetPool(designsFolder);
            var keys = ResolveMatches(item.Paths.FullPath, item.TemplateID, pool, logger);

            return keys
                .Select(key => new { key, design = item.Database.GetItem(key.DesignId) })
                .Where(x => x.design != null)
                .Select(x => new PageDesignMatch(x.design, x.key.ProviderId))
                .ToList();
        }

        /// <inheritdoc/>
        public virtual Item ResolveActivePageDesign(Item item, string experienceContextProviderIdentifier)
        {
            if (item == null)
            {
                return null;
            }

            var matches = GetMatchingPageDesigns(item);
            if (matches.Count == 0)
            {
                return null;
            }

            var standardDesign = matches.FirstOrDefault(match => !match.HasExperienceContextProvider)?.PageDesign;

            if (string.IsNullOrWhiteSpace(experienceContextProviderIdentifier))
            {
                return standardDesign;
            }

            if (!experienceContextProviderRepository.IsProviderActiveForPage(experienceContextProviderIdentifier, item.ID))
            {
                logger.Warn($"[ECP] Provider '{experienceContextProviderIdentifier}' is NOT active for page {item.ID}. Falling back to standard design.", GetType());
                return standardDesign;
            }

            var providerId = experienceContextProviderRepository.GetProviderItemId(experienceContextProviderIdentifier);
            if (providerId.IsNull)
            {
                logger.Warn($"[ECP] Provider '{experienceContextProviderIdentifier}' is active but GetProviderItemId returned Null. Falling back to standard design.", GetType());
                return standardDesign;
            }

            var providerMatch = matches.FirstOrDefault(match => match.ExperienceContextProviderId == providerId);
            if (providerMatch == null)
            {
                logger.Warn($"[ECP] Provider '{experienceContextProviderIdentifier}' (ID: {providerId}) is active but no Page Design found for page template {item.TemplateID}. Falling back to standard design.", GetType());
                return standardDesign;
            }

            logger.Debug($"[ECP] Resolved provider-specific Page Design '{providerMatch.PageDesign.Name}' ({providerMatch.PageDesign.ID}) for provider '{experienceContextProviderIdentifier}'.", GetType());
            return providerMatch.PageDesign;
        }

        /// <summary>
        /// Groups the candidate pool into one design per Experience Context Provider (plus the standard, provider-less
        /// design), keeping within each group the design whose RootItem is the deepest ancestor-or-self of the item.
        /// Pure function over the cached descriptors — no Sitecore access — so it is directly unit-testable.
        /// </summary>
        internal static IReadOnlyList<ResolvedDesignKey> ResolveMatches(string contextPath, ID templateId, IEnumerable<PageDesignInfo> pool, IPresentationLogger logger)
        {
            var candidates = (pool ?? Enumerable.Empty<PageDesignInfo>())
                .Where(info => info != null && info.PageTemplateIds.Contains(templateId))
                .Select(info => new Candidate(info, RootItemDepth(info.RootItemPath, contextPath)))
                .Where(candidate => candidate.Depth >= 0)
                .ToList();

            var result = new List<ResolvedDesignKey>();

            // 1. Standard design (no Experience Context Provider) — deepest RootItem wins.
            var standardWinner = PickDeepest(
                candidates.Where(candidate => candidate.Info.ExperienceContextProviderIds.Count == 0).ToList(),
                logger,
                contextPath,
                "no provider");
            if (standardWinner != null)
            {
                result.Add(new ResolvedDesignKey(standardWinner.Info.Id, ID.Null));
            }

            // 2. Provider-bound designs — expand by provider, then deepest RootItem per provider wins.
            var providerGroups = candidates
                .SelectMany(candidate => candidate.Info.ExperienceContextProviderIds.Select(providerId => new { providerId, candidate }))
                .GroupBy(entry => entry.providerId);

            foreach (var group in providerGroups)
            {
                var winner = PickDeepest(group.Select(entry => entry.candidate).ToList(), logger, contextPath, group.Key.ToString());
                if (winner != null)
                {
                    result.Add(new ResolvedDesignKey(winner.Info.Id, group.Key));
                }
            }

            return result;
        }

        /// <summary>
        /// Returns the RootItem segment depth when <paramref name="rootPath"/> is an ancestor-or-self of
        /// <paramref name="contextPath"/>; otherwise <c>-1</c>. An empty/unset RootItem matches at depth 0.
        /// </summary>
        internal static int RootItemDepth(string rootPath, string contextPath)
        {
            if (string.IsNullOrEmpty(rootPath) || rootPath == "/")
            {
                return 0;
            }

            var normalisedRoot = rootPath.TrimEnd('/');
            var isAncestorOrSelf = contextPath.Equals(normalisedRoot, StringComparison.OrdinalIgnoreCase)
                || contextPath.StartsWith(normalisedRoot + "/", StringComparison.OrdinalIgnoreCase);

            if (!isAncestorOrSelf)
            {
                return -1;
            }

            return normalisedRoot.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries).Length;
        }

        /// <summary>Reads and caches the page designs found directly under the supplied designs folder.</summary>
        internal virtual IReadOnlyList<PageDesignInfo> GetPool(Item designsFolder)
        {
            var cacheKey = $"{CacheKeyPoolPrefix}:{designsFolder.Database.Name}:{designsFolder.ID}";
            return htmlCacheRepository.GetOrAdd(cacheKey, () => FetchPool(designsFolder));
        }

        /// <summary>
        /// Locates the "Page Designs" folder for the item's site. Outside the editors the folder is resolved from the
        /// context site's presentation folder query (otherwise it does not work for Holidays pages requested in TradePortal context e.g. Destinations);
        /// in the editors (or when the query yields nothing) it falls back
        /// to walking up to the nearest ancestor that owns a "Presentation" folder, which works without a site context.
        /// </summary>
        private static Item GetPageDesignsFolder(Item item)
        {
            if (Context.Site != null && Context.PageMode.IsNormal)
            {
                var query = Context.Site.SiteInfo.GetPageDesignsFolderQuery();
                var designsFolder = item.Database.SelectSingleItem(query);
                if (designsFolder != null)
                {
                    return designsFolder;
                }
            }

            for (var ancestor = item; ancestor != null; ancestor = ancestor.Parent)
            {
                var presentation = ancestor.Children.FirstOrDefault(child => child.TemplateID == Templates.Presentation.Id);
                if (presentation != null)
                {
                    return presentation.Children.FirstOrDefault(child => child.TemplateID == Templates.PageDesignsFolder.Id);
                }
            }

            return null;
        }

        private static Candidate PickDeepest(List<Candidate> group, IPresentationLogger logger, string contextPath, string groupLabel)
        {
            if (group.Count == 0)
            {
                return null;
            }

            var ordered = group.OrderByDescending(candidate => candidate.Depth).ToList();
            if (ordered.Count > 1 && ordered[0].Depth == ordered[1].Depth)
            {
                logger?.Warn($"[PageDesign] Ambiguous RootItem configuration for '{contextPath}' (provider group: {groupLabel}): multiple page designs match at depth {ordered[0].Depth}. Using '{ordered[0].Info.Id}'.", typeof(PageDesignRepository));
            }

            return ordered[0];
        }

        private static string ResolveRootItemPath(Item design)
        {
            var field = design.Fields[Templates.PageDesign.Fields.RootItem];
            if (field == null || string.IsNullOrWhiteSpace(field.Value) || !ID.TryParse(field.Value, out var rootId))
            {
                return null;
            }

            return design.Database.GetItem(rootId)?.Paths.FullPath;
        }

        private IReadOnlyList<PageDesignInfo> FetchPool(Item designsFolder)
        {
            return designsFolder.Children
                .Where(child => child.TemplateID == Templates.PageDesign.Id)
                .Select(BuildInfo)
                .ToList();
        }

        private PageDesignInfo BuildInfo(Item design)
        {
            return new PageDesignInfo(
                design.ID,
                fieldUtilsService.GetMultilistTargetIds(Constants.Fields.PageDesign.PageTemplates, design) ?? Array.Empty<ID>(),
                fieldUtilsService.GetMultilistTargetIds(Constants.Fields.PageDesign.ExperienceContextProviders, design) ?? Array.Empty<ID>(),
                ResolveRootItemPath(design));
        }

        private sealed class Candidate
        {
            public Candidate(PageDesignInfo info, int depth)
            {
                Info = info;
                Depth = depth;
            }

            public PageDesignInfo Info { get; }

            public int Depth { get; }
        }
    }
}
