using System.Collections.Generic;
using easyJet.Foundation.Multisite.Models;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Repositories
{
    public interface IHtmlSitemapRepository
    {
        /// <summary>
        ///  Builds collection of page objects required for Sitemap grouped by sections.
        /// </summary>
        /// <param name="sitemapSectionsSettingItem">Sitemap sections setting item.</param>
        /// <param name="sectionItems">Optional subset of section items to build the sitemap for. When provided, only these sections are included. When omitted, all sections referenced by <paramref name="sitemapSectionsSettingItem"/> are used.</param>
        /// <returns>Collection of pages grouped by sections. (Countries, Regions, Deals pages, etc.)</returns>
        List<SitemapSection> BuildSitemapBySections(Item sitemapSectionsSettingItem, params Item[] sectionItems);
    }
}