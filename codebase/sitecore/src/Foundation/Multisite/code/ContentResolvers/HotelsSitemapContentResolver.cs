using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.Multisite.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Multisite.ContentResolvers
{
    public class HotelsSitemapContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private readonly IHtmlSitemapRepository repository;

        public HotelsSitemapContentResolver(IHtmlSitemapRepository repository)
        {
            this.repository = repository;
        }

        /// <summary>
        /// Resolves content for hotels sitemap from sitecore.
        /// When the section has root items configured, pages are grouped by the roots' direct children
        /// and returned as <see cref="SitemapSection.GroupedPages"/> so the FE can render an accordion.
        /// </summary>
        /// <param name="rendering">Sitecore rendering.</param>
        /// <param name="renderingConfig">Rendering configuration.</param>
        /// <returns>Sitemap.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            Item contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            // Hotels sitemap block supports a single section only.
            var sectionItems = contextItem.GetItems(Constants.Fields.SitemapBlock.Sections).Take(1).ToList();
            if (!sectionItems.Any())
            {
                return null;
            }

            var sectionItem = sectionItems[0];
            var sitemapSections = repository.BuildSitemapBySections(contextItem, sectionItem);
            var section = sitemapSections?.FirstOrDefault();
            if (section == null)
            {
                return null;
            }

            section.GroupedPages = BuildGroupedPages(sectionItem, section);

            return new JObject
            {
                ["items"] = JArray.FromObject(new[] { section })
            };
        }

        private static IEnumerable<SitemapGroup> BuildGroupedPages(Item sectionItem, SitemapSection section)
        {
            var roots = sectionItem.GetItems(Constants.Fields.SitemapBase.Roots).ToList();
            if (!roots.Any())
            {
                return Enumerable.Empty<SitemapGroup>();
            }

            var children = roots.SelectMany(root => root.Children.ToList()).ToList();
            if (!children.Any())
            {
                return Enumerable.Empty<SitemapGroup>();
            }

            var isSorted = MainUtil.GetBool(sectionItem[Constants.Fields.SitemapBase.IsSorted], false);
            var groups = new List<SitemapGroup>();

            foreach (var child in children)
            {
                var childUrl = child.GetItemUrl();
                if (string.IsNullOrEmpty(childUrl))
                {
                    continue;
                }

                var childPages = section.Pages
                    ?.Where(p => !string.IsNullOrEmpty(p.Url) &&
                                 p.Url.StartsWith(childUrl + "/", System.StringComparison.OrdinalIgnoreCase));

                if (childPages == null || !childPages.Any())
                {
                    continue;
                }

                if (isSorted)
                {
                    childPages = childPages.OrderBy(p => p.Name);
                }

                groups.Add(new SitemapGroup
                {
                    Id = child.ID.Guid.ToString(),
                    Title = child.DisplayName,
                    Pages = childPages.ToList()
                });
            }

            return groups.Any() ? groups : Enumerable.Empty<SitemapGroup>();
        }
    }
}