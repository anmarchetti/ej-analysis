using System.Collections.Generic;
using easyJet.Foundation.Multisite.Models;
using Sitecore.Globalization;

namespace easyJet.Foundation.Multisite.Repositories
{
    public interface IXmlSitemapRepository
    {
        /// <summary>
        /// Builds collection of page objects required for Sitemap.
        /// Pages with templates provided in Multisite.Sitemap.TemplatesToExclude setting - will be skipped.
        /// </summary>
        /// <param name="sitemapType">Type of sitemap eg. Hotel sitamap, Country sitemap etc.</param>
        /// <returns>Collection of pages.</returns>
        IEnumerable<SitemapItem> BuildSitemap(Language language, string sitemapType = null);

        IEnumerable<IndexSitemapItem> BuildIndexSitemap();
    }
}