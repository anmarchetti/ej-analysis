using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.Redirects.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Feature.Redirects.Services
{
    [Service(typeof(IRedirectRuleRepository), Lifetime = Lifetime.Singleton)]
    public class RedirectRuleRepository : IRedirectRuleRepository
    {
        private const string RulesRootPathSetting = "Redirects.RedirectRulesRootPath";
        private const string DefaultGroupName = "Ungrouped";

        public Item GetRulesRoot(Database database)
        {
            if (database == null)
            {
                return null;
            }

            var rootPath = Settings.GetSetting(RulesRootPathSetting);
            return string.IsNullOrWhiteSpace(rootPath) ? null : database.GetItem(rootPath);
        }

        public IReadOnlyCollection<RedirectRuleItem> GetRules(Database database)
        {
            var root = GetRulesRoot(database);
            if (root == null)
            {
                return Array.Empty<RedirectRuleItem>();
            }

            var languageMaps = RedirectRuleHelper.BuildLanguageMaps(database);
            var rules = root.Axes.GetDescendants()
                .Where(item => item.TemplateID == Templates.RedirectRule.ID)
                .Select(item => MapRule(item, root, languageMaps.NamesById))
                .Where(rule => rule != null)
                .ToList();

            return rules;
        }

        public Item GetRuleItemById(Database database, ID id)
        {
            return database?.GetItem(id);
        }

        public Item FindRule(Database database, string normalizedFromUrl, string languages, LanguageMaps languageMaps)
        {
            if (string.IsNullOrWhiteSpace(normalizedFromUrl))
            {
                return null;
            }

            var root = GetRulesRoot(database);
            if (root == null)
            {
                return null;
            }

            var requestedLanguages = RedirectRuleHelper.ParseLanguageNames(languages);
            return root.Axes.GetDescendants()
                .FirstOrDefault(item => item.TemplateID == Templates.RedirectRule.ID
                    && string.Equals(RedirectRuleHelper.NormalizePattern(item[Templates.RedirectRule.Fields.FromUrl]), normalizedFromUrl, StringComparison.OrdinalIgnoreCase)
                    && RedirectRuleHelper.GetRuleLanguageNames(item, languageMaps?.NamesById)
                        .SetEquals(requestedLanguages));
        }

        public Item CreateRule(Database database, RedirectRuleInput input)
        {
            var root = GetRulesRoot(database);
            if (root == null)
            {
                return null;
            }

            var itemName = BuildItemName(input.FromUrl);
            var parent = RedirectRuleGroupHelper.ResolveOrCreateGroup(root, input.GroupName, DefaultGroupName) ?? root;

            using (new SecurityDisabler())
            {
                var item = parent.Add(itemName, new TemplateID(Templates.RedirectRule.ID));

                return UpdateRule(item, input);
            }
        }

        public Item UpdateRule(Item item, RedirectRuleInput input)
        {
            if (item == null)
            {
                return null;
            }

            var languageMaps = RedirectRuleHelper.BuildLanguageMaps(item.Database);
            using (new SecurityDisabler())
            using (new EditContext(item, false, true))
            {
                item[Templates.RedirectRule.Fields.FromUrl] = input.FromUrl?.Trim() ?? string.Empty;
                item[Templates.RedirectRule.Fields.ToUrl] = input.ToUrl?.Trim() ?? string.Empty;
                item[Templates.RedirectRule.Fields.RedirectType] = input.RedirectType.ToString();
                item[Templates.RedirectRule.Fields.Comments] = input.Comments ?? string.Empty;
                item[Templates.RedirectRule.Fields.Priority] = input.Priority.ToString();
                item[Templates.RedirectRule.Fields.FilterPageTypes] = RedirectRuleHelper.NormalizeFilterPageTypes(input.FilterPageTypes);
                item[Templates.RedirectRule.Fields.Languages] = RedirectRuleHelper.GetItemLanguages(input.Languages, languageMaps.IdsByName);
                if (input.Status.HasValue)
                {
                    item[Templates.RedirectRule.Fields.Status] = input.Status.Value.ToString();
                }

                if (input.RelatedItem != null)
                {
                    item[Templates.RedirectRule.Fields.RelatedItem] = string.IsNullOrWhiteSpace(input.RelatedItem)
                        ? string.Empty
                        : input.RelatedItem.Trim();
                }
            }

            return item;
        }

        public void DeleteRule(Item item)
        {
            if (item == null)
            {
                return;
            }

            using (new SecurityDisabler())
            {
                item.Delete();
            }
        }

        private static RedirectRuleItem MapRule(Item item, Item root, IReadOnlyDictionary<ID, string> languageNamesById)
        {
            if (item == null)
            {
                return null;
            }

            var fromUrl = item[Templates.RedirectRule.Fields.FromUrl];
            var groupItem = ResolveGroupItem(item, root);
            var filterPageTypes = item[Templates.RedirectRule.Fields.FilterPageTypes];
            var languageNames = RedirectRuleHelper.GetRuleLanguageNames(item, languageNamesById);

            return new RedirectRuleItem
            {
                Id = item.ID,
                FromUrl = fromUrl,
                ToUrl = item[Templates.RedirectRule.Fields.ToUrl],
                RedirectType = MainUtil.GetInt(item[Templates.RedirectRule.Fields.RedirectType], 301),
                Comments = item[Templates.RedirectRule.Fields.Comments],
                Priority = MainUtil.GetInt(item[Templates.RedirectRule.Fields.Priority], 0),
                FilterPageTypes = filterPageTypes,
                FilterPageTypeIds = RedirectRuleHelper.ParseFilterPageTypes(filterPageTypes),
                Created = item.Statistics.Created,
                CreatedBy = item.Statistics.CreatedBy,
                SortOrder = item.Appearance.Sortorder,
                ItemPath = item.Paths.FullPath,
                IsWildcard = RedirectRuleHelper.IsWildcardPattern(fromUrl),
                IsRegex = RedirectRuleHelper.IsRegexPattern(fromUrl),
                NormalizedFromUrl = RedirectRuleHelper.NormalizePattern(fromUrl),
                GroupId = groupItem?.ID ?? ID.Null,
                GroupName = GetGroupName(groupItem, root),
                Languages = string.Join(",", languageNames),
                LanguageNames = languageNames,
                Status = RedirectRuleHelper.ParseStatus(item[Templates.RedirectRule.Fields.Status]),
                RelatedItemId = RedirectRuleHelper.ParseRelatedItemId(item[Templates.RedirectRule.Fields.RelatedItem])
            };
        }

        private static string BuildItemName(string fromUrl)
        {
            var safeName = ItemUtil.ProposeValidItemName(fromUrl ?? string.Empty);
            if (string.IsNullOrWhiteSpace(safeName))
            {
                safeName = "redirect-rule";
            }

            return $"{safeName}-{Guid.NewGuid():N}".Substring(0, Math.Min(50, safeName.Length + 33));
        }

        private static Item ResolveGroupItem(Item item, Item root)
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

        private static string GetGroupName(Item groupItem, Item root)
        {
            if (groupItem == null || root == null || groupItem.ID == root.ID)
            {
                return DefaultGroupName;
            }

            return string.IsNullOrWhiteSpace(groupItem.DisplayName) ? groupItem.Name : groupItem.DisplayName;
        }
    }
}
