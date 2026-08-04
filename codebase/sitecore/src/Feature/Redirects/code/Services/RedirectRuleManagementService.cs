using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using CsvHelper;
using easyJet.Feature.Redirects.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;
using Sitecore.Buckets.Managers;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.Globalization;
using Sitecore.SecurityModel;
using Sitecore.Sites;

namespace easyJet.Feature.Redirects.Services
{
    [Service(typeof(IRedirectRuleManagementService), Lifetime = Lifetime.Transient)]
    public class RedirectRuleManagementService : IRedirectRuleManagementService
    {
        private const string CsvDelimiter = ",";
        private const string DefaultGroupName = "Ungrouped";
        private const string WebDatabaseName = "web";
        private const int PermanentRedirectType = 301;

        private readonly IRedirectRuleRepository repository;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly BaseLinkManager linkManager;
        private readonly BaseFactory factory;

        public RedirectRuleManagementService(
            IRedirectRuleRepository repository,
            ICsvUtilsService csvUtilsService,
            BaseLinkManager linkManager,
            BaseFactory factory)
        {
            this.repository = repository;
            this.csvUtilsService = csvUtilsService;
            this.linkManager = linkManager;
            this.factory = factory;
        }

        public RedirectRuleImportResult ImportCsv(Stream stream, Database database)
        {
            var result = new RedirectRuleImportResult();
            if (!TryLoadImportRows(stream, database, result, out var rows))
            {
                return result;
            }

            var processed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var touchedIds = new HashSet<ID>();
            var existingRules = new Dictionary<string, ID>(StringComparer.OrdinalIgnoreCase);
            foreach (var rule in repository.GetRules(database))
            {
                var key = BuildImportRuleKey(rule.NormalizedFromUrl, rule.Languages);
                existingRules[key] = rule.Id;
            }

            var context = new ImportContext(database, existingRules, touchedIds, result);
            foreach (var row in rows.Select((value, index) => new { value, index }))
            {
                ProcessImportRow(row.value, row.index + 2, processed, context);
            }

            ClearItemCaches(database, touchedIds);
            RedirectRulesCache.ClearAll();
            return result;
        }

        public byte[] ExportCsv(Database database)
        {
            var rules = repository.GetRules(database);
            var rows = rules.Select(rule => new RedirectRuleCsvRow
            {
                FromUrl = rule.FromUrl,
                ToUrl = rule.ToUrl,
                SetupDate = rule.Created.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture),
                SitecoreUser = rule.CreatedBy,
                Comments = rule.Comments,
                RedirectType = rule.RedirectType.ToString(CultureInfo.InvariantCulture),
                Priority = rule.Priority.ToString(CultureInfo.InvariantCulture),
                FilterPageTypes = rule.FilterPageTypes,
                Group = rule.GroupName == DefaultGroupName ? string.Empty : rule.GroupName,
                Languages = rule.Languages,
                MarkRecordToDelete = string.Empty
            }).ToList();

            var csvConfig = new CsvHelper.Configuration.Configuration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                Delimiter = CsvDelimiter
            };

            using (var ms = new MemoryStream())
            using (var writer = new StreamWriter(ms, Encoding.UTF8))
            using (var csvWriter = new CsvWriter(writer, csvConfig))
            {
                csvWriter.Configuration.RegisterClassMap<RedirectRuleCsvMap>();
                csvWriter.WriteRecords(rows);
                writer.Flush();
                ms.Flush();
                return ms.ToArray();
            }
        }

        public RedirectRuleItem UpsertRule(Database database, RedirectRuleInput input, out bool created, out string error)
        {
            created = false;
            error = null;

            if (database == null)
            {
                error = "Database was not provided.";
                return null;
            }

            if (input == null || string.IsNullOrWhiteSpace(input.FromUrl))
            {
                error = "From URL is required.";
                return null;
            }

            if (input.Status == RedirectRuleStatus.AwaitingPublish)
            {
                if (string.IsNullOrWhiteSpace(input.RelatedItem))
                {
                    error = "Related item is required for AwaitingPublish rules.";
                    return null;
                }
            }
            else if (string.IsNullOrWhiteSpace(input.ToUrl))
            {
                error = "From URL and To URL are required.";
                return null;
            }

            if (input.RedirectType != 301 && input.RedirectType != 302)
            {
                error = "Redirect type must be 301 or 302.";
                return null;
            }

            if (input.Priority < 0)
            {
                error = "Priority must be a non-negative integer.";
                return null;
            }

            if (!TryNormalizeFilterPageTypes(input.FilterPageTypes, out var filterPageTypes, out var filterError))
            {
                error = filterError;
                return null;
            }

            input.FilterPageTypes = filterPageTypes;
            input.GroupName = input.GroupName?.Trim();
            var normalizedFromUrl = RedirectRuleHelper.NormalizePattern(input.FromUrl);
            var languageMaps = RedirectRuleHelper.BuildLanguageMaps(database);
            var existing = repository.FindRule(database, normalizedFromUrl, input.Languages, languageMaps);
            Item item;
            if (existing != null)
            {
                if (!CanUpdateExisting(existing, input, out error))
                {
                    return null;
                }

                item = repository.UpdateRule(existing, input);
            }
            else
            {
                created = true;
                item = repository.CreateRule(database, input);
            }

            if (item == null)
            {
                error = "Failed to save the redirect rule.";
                return null;
            }

            MoveToGroupIfNeeded(database, item, input.GroupName);
            ClearItemCaches(item);
            RedirectRulesCache.ClearAll();
            return repository.GetRules(database).FirstOrDefault(rule => rule.Id == item.ID);
        }

        public int ActivateReadyRules(Database database, out string error)
        {
            error = null;
            if (database == null)
            {
                error = "Database was not provided.";
                return 0;
            }

            var webDatabase = factory.GetDatabase(WebDatabaseName);
            if (webDatabase == null)
            {
                error = "Web database was not found.";
                return 0;
            }

            var activated = 0;
            var processedRelatedItems = new HashSet<ID>();
            foreach (var rule in repository.GetRules(database)
                .Where(candidate => candidate.Status == RedirectRuleStatus.AwaitingPublish && !candidate.RelatedItemId.IsNull))
            {
                if (!processedRelatedItems.Add(rule.RelatedItemId))
                {
                    continue;
                }

                if (TryActivateRelatedRules(database, webDatabase, rule))
                {
                    activated++;
                }
            }

            if (activated > 0)
            {
                RedirectRulesCache.ClearAll();
            }

            return activated;
        }

        public bool DeleteRule(Database database, string id, out string error)
        {
            error = null;
            if (database == null)
            {
                error = "Database was not provided.";
                return false;
            }

            if (!ID.TryParse(id, out var parsedId))
            {
                error = "Invalid rule id.";
                return false;
            }

            var item = repository.GetRuleItemById(database, parsedId);
            if (item == null)
            {
                error = "Rule not found.";
                return false;
            }

            repository.DeleteRule(item);
            ClearItemCaches(database, new ID[] { parsedId });
            RedirectRulesCache.ClearAll();
            return true;
        }

        private static bool TryResolveImportRuleKey(
            RedirectRuleCsvRow row,
            int lineNumber,
            HashSet<string> processed,
            RedirectRuleImportResult result,
            out string fromUrl,
            out string ruleKey)
        {
            fromUrl = row?.FromUrl?.Trim();
            ruleKey = string.Empty;
            if (string.IsNullOrWhiteSpace(fromUrl))
            {
                AddImportError(result, lineNumber, "From URL is required.");
                return false;
            }

            var normalized = RedirectRuleHelper.NormalizePattern(fromUrl);
            ruleKey = BuildImportRuleKey(normalized, row.Languages);
            if (!processed.Add(ruleKey))
            {
                AddImportError(result, lineNumber, $"Duplicate From URL in CSV: '{fromUrl}'.");
                return false;
            }

            return true;
        }

        private static bool TryResolveToUrl(RedirectRuleCsvRow row, int lineNumber, RedirectRuleImportResult result, out string toUrl)
        {
            toUrl = row?.ToUrl?.Trim();
            if (string.IsNullOrWhiteSpace(toUrl))
            {
                AddImportError(result, lineNumber, "To URL is required.");
                return false;
            }

            return true;
        }

        private static bool TryResolveRedirectType(RedirectRuleCsvRow row, int lineNumber, RedirectRuleImportResult result, out int redirectType)
        {
            redirectType = 0;
            if (!int.TryParse(row?.RedirectType?.Trim(), out redirectType) || (redirectType != 301 && redirectType != 302))
            {
                AddImportError(result, lineNumber, "Redirect type must be 301 or 302.");
                return false;
            }

            return true;
        }

        private static bool IsEmptyRow(RedirectRuleCsvRow row)
        {
            if (row == null)
            {
                return true;
            }

            return string.IsNullOrWhiteSpace(row.FromUrl)
                && string.IsNullOrWhiteSpace(row.ToUrl)
                && string.IsNullOrWhiteSpace(row.SetupDate)
                && string.IsNullOrWhiteSpace(row.SitecoreUser)
                && string.IsNullOrWhiteSpace(row.Comments)
                && string.IsNullOrWhiteSpace(row.RedirectType)
                && string.IsNullOrWhiteSpace(row.Priority)
                && string.IsNullOrWhiteSpace(row.FilterPageTypes)
                && string.IsNullOrWhiteSpace(row.Languages)
                && string.IsNullOrWhiteSpace(row.Group)
                && string.IsNullOrWhiteSpace(row.MarkRecordToDelete);
        }

        private static bool TryResolvePriority(RedirectRuleCsvRow row, int lineNumber, RedirectRuleImportResult result, out int priority)
        {
            priority = 0;
            if (string.IsNullOrWhiteSpace(row?.Priority))
            {
                return true;
            }

            if (!int.TryParse(row.Priority.Trim(), out priority) || priority < 0)
            {
                AddImportError(result, lineNumber, "Priority must be a non-negative integer.");
                return false;
            }

            return true;
        }

        private static RedirectRuleInput BuildImportInput(
            RedirectRuleCsvRow row,
            string fromUrl,
            string toUrl,
            int redirectType,
            int priority)
        {
            return new RedirectRuleInput
            {
                FromUrl = fromUrl,
                ToUrl = toUrl,
                RedirectType = redirectType,
                Comments = row?.Comments,
                Priority = priority,
                FilterPageTypes = NormalizeFilterPageTypesForImport(row?.FilterPageTypes),
                Languages = row?.Languages,
                GroupName = row?.Group?.Trim()
            };
        }

        private static void AddImportError(RedirectRuleImportResult result, int lineNumber, string message)
        {
            if (result == null)
            {
                return;
            }

            result.Errors.Add($"Row {lineNumber}: {message}");
            result.Skipped++;
        }

        private static string BuildImportRuleKey(string normalizedFromUrl, string languages)
        {
            var normalizedLanguages = string.Join(
                ",",
                RedirectRuleHelper.ParseLanguageNames(languages)
                    .OrderBy(language => language, StringComparer.OrdinalIgnoreCase));

            return $"{normalizedFromUrl}|{normalizedLanguages}";
        }

        private static bool CanUpdateExisting(Item existing, RedirectRuleInput input, out string error)
        {
            error = null;
            var inputRelatedItemId = RedirectRuleHelper.ParseRelatedItemId(input?.RelatedItem);
            if (inputRelatedItemId.IsNull)
            {
                return true;
            }

            var existingRelatedItemId = RedirectRuleHelper.ParseRelatedItemId(
                existing[Templates.RedirectRule.Fields.RelatedItem]);
            if (existingRelatedItemId.IsNull)
            {
                error = "A redirect rule already exists for this URL.";
                return false;
            }

            if (existingRelatedItemId != inputRelatedItemId)
            {
                error = "A redirect rule already exists for this URL with a different related item.";
                return false;
            }

            return true;
        }

        private static bool TryNormalizeFilterPageTypes(string value, out string normalized, out string error)
        {
            normalized = string.Empty;
            error = null;

            if (string.IsNullOrWhiteSpace(value))
            {
                return true;
            }

            var parts = RedirectRuleHelper.SplitFilterPageTypes(value);
            foreach (var part in parts)
            {
                if (!ID.TryParse(part, out _))
                {
                    error = "FilterPageTypes must contain valid template IDs separated by '|'.";
                    return false;
                }
            }

            normalized = string.Join("|", parts);
            return true;
        }

        private static string NormalizeFilterPageTypesForImport(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var parts = RedirectRuleHelper.SplitFilterPageTypes(value);
            var validIds = new List<string>();
            foreach (var part in parts)
            {
                if (ID.TryParse(part, out var id))
                {
                    validIds.Add(id.ToString());
                }
            }

            return string.Join("|", validIds);
        }

        private static Language ResolveRuleLanguage(RedirectRuleItem rule)
        {
            var languageName = rule?.LanguageNames?.FirstOrDefault();
            return string.IsNullOrWhiteSpace(languageName)
                ? Language.Parse("en")
                : Language.Parse(languageName);
        }

        private static RedirectRuleInput MapToInput(RedirectRuleItem rule, string toUrl, RedirectRuleStatus status)
        {
            return new RedirectRuleInput
            {
                FromUrl = rule.FromUrl,
                ToUrl = toUrl,
                RedirectType = status == RedirectRuleStatus.Active ? PermanentRedirectType : rule.RedirectType,
                Comments = rule.Comments,
                Priority = rule.Priority,
                FilterPageTypes = rule.FilterPageTypes,
                Languages = rule.Languages,
                Status = status
            };
        }

        private static Item ResolveCurrentGroup(Item item, Item root)
        {
            if (item == null || root == null)
            {
                return null;
            }

            if (item.ID == root.ID)
            {
                return root;
            }

            return item.Axes.GetAncestors()
                       .FirstOrDefault(ancestor => ancestor.TemplateID == Templates.RedirectRulesFolder.ID && ancestor.ParentID == root.ID)
                   ?? root;
        }

        private static void ClearItemCaches(Item item)
        {
            if (item == null)
            {
                return;
            }

            ClearItemCaches(item.Database, new[] { item.ID });
        }

        private static void ClearItemCaches(Database database, IEnumerable<ID> ids)
        {
            if (database?.Caches == null || ids == null)
            {
                return;
            }

            var caches = database.Caches;
            foreach (var id in ids.Where(candidate => !ID.IsNullOrEmpty(candidate)))
            {
                caches.ItemCache?.RemoveItem(id);
                caches.DataCache?.RemoveItemInformation(id);
            }
        }

        private bool TryActivateRelatedRules(
            Database database,
            Database webDatabase,
            RedirectRuleItem triggerRule)
        {
            if (!TryResolvePublishedTargetUrl(webDatabase, triggerRule.RelatedItemId, ResolveRuleLanguage(triggerRule), out var toUrl))
            {
                return false;
            }

            if (RedirectRuleHelper.IsSameUrl(triggerRule.FromUrl, toUrl))
            {
                return false;
            }

            var allRelatedRules = repository.GetRules(database)
                .Where(rule => rule.RelatedItemId == triggerRule.RelatedItemId)
                .ToList();

            if (allRelatedRules.Count == 0)
            {
                return false;
            }

            foreach (var rule in allRelatedRules)
            {
                var ruleItem = repository.GetRuleItemById(database, rule.Id);
                if (ruleItem == null)
                {
                    continue;
                }

                if (RedirectRuleHelper.IsSameUrl(rule.FromUrl, toUrl))
                {
                    repository.DeleteRule(ruleItem);
                }
                else
                {
                    repository.UpdateRule(ruleItem, MapToInput(rule, toUrl, RedirectRuleStatus.Active));
                }

                ClearItemCaches(ruleItem);
            }

            return true;
        }

        private bool TryResolvePublishedTargetUrl(Database webDatabase, ID relatedItemId, Language language, out string toUrl)
        {
            toUrl = null;
            var webItem = webDatabase.GetItem(relatedItemId, language);
            if (webItem == null)
            {
                return false;
            }

            var siteContext = webItem.GetSiteContext();
            using (siteContext != null ? new SiteContextSwitcher(siteContext) : null)
            {
                toUrl = RedirectRuleHelper.ToHotelRedirectRuleUrl(linkManager.GetItemUrl(webItem));
            }

            return !string.IsNullOrWhiteSpace(toUrl);
        }

        private bool TryLoadImportRows(Stream stream, Database database, RedirectRuleImportResult result, out List<RedirectRuleCsvRow> rows)
        {
            rows = null;
            if (stream == null || database == null)
            {
                result.Errors.Add("CSV file or database was not provided.");
                return false;
            }

            try
            {
                var fileParameters = new Foundation.SitecoreExtensions.Models.FileParameters
                {
                    FileDataDelimiter = CsvDelimiter,
                    HasHeaderRecord = true,
                    ClassMap = typeof(RedirectRuleCsvMap)
                };
                rows = csvUtilsService.ReadFromCsv<RedirectRuleCsvRow>(stream, fileParameters);
                return true;
            }
            catch (Exception ex)
            {
                Log.Error("Redirect CSV import failed to parse.", ex, this);
                result.Errors.Add("CSV parsing failed. Ensure the file is a valid CSV with the required headers.");
                return false;
            }
        }

        private void ProcessImportRow(
            RedirectRuleCsvRow row,
            int lineNumber,
            HashSet<string> processed,
            ImportContext context)
        {
            if (IsEmptyRow(row))
            {
                return;
            }

            if (!TryResolveImportRuleKey(row, lineNumber, processed, context.Result, out var fromUrl, out var ruleKey))
            {
                return;
            }

            if (row.ShouldDelete)
            {
                HandleDeleteRow(ruleKey, fromUrl, lineNumber, context);
                return;
            }

            if (!TryResolveToUrl(row, lineNumber, context.Result, out var toUrl))
            {
                return;
            }

            if (!TryResolveRedirectType(row, lineNumber, context.Result, out var redirectType))
            {
                return;
            }

            if (!TryResolvePriority(row, lineNumber, context.Result, out var priority))
            {
                return;
            }

            var input = BuildImportInput(row, fromUrl, toUrl, redirectType, priority);
            UpsertImportRule(ruleKey, input, lineNumber, fromUrl, context);
        }

        private void HandleDeleteRow(
            string ruleKey,
            string fromUrl,
            int lineNumber,
            ImportContext context)
        {
            if (!context.ExistingRules.TryGetValue(ruleKey, out var existingId))
            {
                AddImportError(context.Result, lineNumber, $"Rule not found for delete: '{fromUrl}'.");
                return;
            }

            var existingItem = repository.GetRuleItemById(context.Database, existingId);
            repository.DeleteRule(existingItem);
            context.TouchedIds.Add(existingId);
            context.ExistingRules.Remove(ruleKey);
            context.Result.Deleted++;
        }

        private void UpsertImportRule(
            string ruleKey,
            RedirectRuleInput input,
            int lineNumber,
            string fromUrl,
            ImportContext context)
        {
            if (context.ExistingRules.TryGetValue(ruleKey, out var ruleId))
            {
                var existingItem = repository.GetRuleItemById(context.Database, ruleId);
                repository.UpdateRule(existingItem, input);
                MoveToGroupIfNeeded(context.Database, existingItem, input.GroupName);
                context.TouchedIds.Add(ruleId);
                context.Result.Updated++;
                return;
            }

            var created = repository.CreateRule(context.Database, input);
            if (created == null)
            {
                AddImportError(context.Result, lineNumber, $"Failed to create rule '{fromUrl}'.");
                return;
            }

            context.ExistingRules[ruleKey] = created.ID;
            MoveToGroupIfNeeded(context.Database, created, input.GroupName);
            context.TouchedIds.Add(created.ID);
            context.Result.Added++;
        }

        private void MoveToGroupIfNeeded(Database database, Item item, string groupName)
        {
            if (database == null || item == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(groupName))
            {
                return;
            }

            var root = repository.GetRulesRoot(database);
            if (root == null)
            {
                return;
            }

            var targetGroup = RedirectRuleGroupHelper.ResolveOrCreateGroup(root, groupName, DefaultGroupName);
            if (targetGroup == null)
            {
                return;
            }

            var currentGroup = ResolveCurrentGroup(item, root);
            if (currentGroup != null && currentGroup.ID == targetGroup.ID)
            {
                return;
            }

            using (new SecurityDisabler())
            {
                if (BucketManager.IsBucket(targetGroup))
                {
                    BucketManager.MoveItemIntoBucket(item, targetGroup);
                }
                else
                {
                    item.MoveTo(targetGroup);
                }
            }
        }

        private sealed class ImportContext
        {
            public ImportContext(
                Database database,
                Dictionary<string, ID> existingRules,
                HashSet<ID> touchedIds,
                RedirectRuleImportResult result)
            {
                Database = database;
                ExistingRules = existingRules;
                TouchedIds = touchedIds;
                Result = result;
            }

            public Database Database { get; }

            // Import keys combine normalized from URL and normalized language set.
            public Dictionary<string, ID> ExistingRules { get; }

            public HashSet<ID> TouchedIds { get; }

            public RedirectRuleImportResult Result { get; }
        }
    }
}
