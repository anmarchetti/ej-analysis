using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Presentation.Logging;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Extensions
{
    public static class ItemExtensions
    {
        /// <summary>
        /// Gets the Sitecore query for page design items filtering by the current page's template.
        /// </summary>
        /// <param name="item">The page item.</param>
        /// <returns>A Sitecore query string for page design matching the page template.</returns>
        public static string GetPageDesignQuery(this Item item)
        {
            var pageTemplateId = GetPageTemplateId(item);
            return $"{Context.Site.SiteInfo.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.PageDesignsFolder.Id}']/*[@@templateid = '{Templates.PageDesign.Id}' and contains(@PageTemplates, '" + pageTemplateId + "')]";
        }

        /// <summary>
        ///     Get query for hotel designs folder .
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Sitecore query.</returns>
        public static string GetHotelDesignsFolderQuery(this Item item)
        {
            return $"{Context.Site.SiteInfo.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.HotelDesignsFolder.Id}']";
        }

        /// <summary>
        ///     Get query for multivariant page design query.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Sitecore query.</returns>
        public static string GetMultivariantPageDesignQuery(this Item item)
        {
            var pageTemplateId = GetPageTemplateId(item);
            return $"{Context.Site.SiteInfo.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.MultivatiantPageDesignFolder.Id}']/*[@@templateid = '{Templates.MultivatiantPageDesign.Id}' and contains(@PageTemplates, '" + pageTemplateId + "')]";
        }

        /// <summary>
        ///     Get Multivariant Page Design.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Multivariant Page Design.</returns>
        public static Item GetMultivariantPageDesign(this Item item)
        {
            if (item == null)
            {
                return null;
            }

            var query = item.GetMultivariantPageDesignQuery();
            if (string.IsNullOrEmpty(query))
            {
                return null;
            }

            var pageDesign = item.Database.SelectSingleItem(query);
            return pageDesign;
        }

        /// <summary>
        ///     Gets the multivariant page design for a specific experience context provider.
        /// </summary>
        /// <param name="item">The page item.</param>
        /// <param name="experienceContextProviderId">The ID of the experience context provider.</param>
        /// <returns>The provider-specific multivariant page design, or null if not found.</returns>
        public static Item GetMultivariantPageDesignForProvider(this Item item, ID experienceContextProviderId)
        {
            if (item == null || experienceContextProviderId.IsNull)
            {
                return null;
            }

            if (Context.Site?.SiteInfo == null)
            {
                return null;
            }

            var pageTemplateId = GetPageTemplateId(item);
            var query = $"{Context.Site.SiteInfo.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.MultivatiantPageDesignFolder.Id}']/*[@@templateid = '{Templates.MultivatiantPageDesign.Id}' and contains(@PageTemplates, '" + pageTemplateId + "') and contains(@ExperienceContextProviders, '" + experienceContextProviderId + "')]";

            if (string.IsNullOrEmpty(query))
            {
                return null;
            }

            var pageDesign = item.Database.SelectSingleItem(query);
            return pageDesign;
        }

        /// <summary>
        ///     Gets the Sitecore query for page design items filtered by both the current page's template
        ///     and a specific experience context provider.
        /// </summary>
        /// <param name="item">The page item.</param>
        /// <param name="experienceContextProviderId">The ID of the experience context provider.</param>
        /// <returns>A Sitecore query string, or <c>null</c> when it cannot be built.</returns>
        public static string GetPageDesignForProviderQuery(this Item item, ID experienceContextProviderId)
        {
            if (item == null || experienceContextProviderId.IsNull || Context.Site?.SiteInfo == null)
            {
                return null;
            }

            var pageTemplateId = GetPageTemplateId(item);
            return $"{Context.Site.SiteInfo.GetPresentationFolderQuery()}/*[@@templateid ='{Templates.PageDesignsFolder.Id}']/*[@@templateid = '{Templates.PageDesign.Id}' and contains(@PageTemplates, '" + pageTemplateId + "') and contains(@ExperienceContextProviders, '" + experienceContextProviderId + "')]";
        }

        /// <summary>
        ///     Resolves the page design for the context item by running <paramref name="query"/> and choosing the
        ///     candidate whose RootItem is the deepest ancestor-or-self of the context item's path.
        /// </summary>
        /// <param name="contextItem">The page item being rendered.</param>
        /// <param name="query">A Sitecore query selecting candidate page designs (already filtered by template).</param>
        /// <param name="logger">Logger used to warn about ambiguous RootItem configurations.</param>
        /// <returns>The winning page design, or <c>null</c> when none match.</returns>
        public static Item ResolvePageDesignByRootItem(this Item contextItem, string query, IPresentationLogger logger)
        {
            if (contextItem == null || string.IsNullOrEmpty(query))
            {
                return null;
            }

            var candidates = contextItem.Database.SelectItems(query);
            return SelectDeepestRootItemMatch(contextItem, candidates, logger);
        }

        /// <summary>
        ///     From a set of candidate page designs, selects the one whose RootItem is the deepest
        ///     ancestor-or-self of the context item. Candidates whose RootItem is not an ancestor-or-self of the
        ///     context item are ignored; an empty RootItem matches any context item at depth 0 (lowest priority).
        ///     When several candidates tie at the deepest RootItem, a warning is logged and the first is returned.
        /// </summary>
        /// <param name="contextItem">The page item being rendered.</param>
        /// <param name="candidates">Candidate page designs already matched by template.</param>
        /// <param name="logger">Logger used to warn about ambiguous RootItem configurations.</param>
        /// <returns>The winning page design, or <c>null</c> when none match.</returns>
        internal static Item SelectDeepestRootItemMatch(Item contextItem, IEnumerable<Item> candidates, IPresentationLogger logger)
        {
            if (contextItem == null || candidates == null)
            {
                return null;
            }

            var contextPath = contextItem.Paths.FullPath;
            var matches = candidates
                .Where(design => design != null)
                .Select(design => new { Design = design, Depth = GetRootItemDepth(design, contextPath) })
                .Where(match => match.Depth >= 0)
                .ToList();

            if (matches.Count == 0)
            {
                return null;
            }

            var maxDepth = matches.Max(match => match.Depth);
            var winners = matches.Where(match => match.Depth == maxDepth).ToList();

            if (winners.Count > 1)
            {
                var paths = string.Join(", ", winners.Select(winner => winner.Design.Paths.FullPath));
                logger?.Warn($"[PageDesign] Ambiguous RootItem configuration for context item '{contextPath}': {winners.Count} page designs match at depth {maxDepth} ({paths}). Using '{winners[0].Design.Paths.FullPath}'.", typeof(ItemExtensions));
            }

            return winners[0].Design;
        }

        /// <summary>
        ///     Returns the RootItem segment depth when the design's RootItem is an ancestor-or-self of
        ///     <paramref name="contextPath"/>; otherwise <c>-1</c>. An empty/unset RootItem matches at depth 0.
        /// </summary>
        private static int GetRootItemDepth(Item design, string contextPath)
        {
            var rootPath = GetRootItemPath(design);
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

        /// <summary>
        ///     Reads the RootItem droptree field and resolves it to the referenced item's full path.
        ///     Returns <c>null</c> when the field is empty or its target cannot be resolved (treated as root).
        /// </summary>
        private static string GetRootItemPath(Item design)
        {
            var field = design.Fields[Templates.PageDesign.Fields.RootItem];
            if (field == null || string.IsNullOrWhiteSpace(field.Value) || !ID.TryParse(field.Value, out var rootId))
            {
                return null;
            }

            return design.Database.GetItem(rootId)?.Paths.FullPath;
        }

        private static string GetPageTemplateId(Item item)
        {
            return item.TemplateID.Guid.ToString("B").ToUpperInvariant();
        }
    }
}