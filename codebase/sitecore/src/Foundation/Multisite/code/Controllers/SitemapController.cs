using System.Web.Mvc;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Repositories;
using easyJet.Foundation.SitecoreExtensions.Controllers;

namespace easyJet.Foundation.Multisite.Controllers
{
    public class SitemapController : BaseServicesApiController
    {
        private readonly IXmlSitemapRepository sitemapRepository;

        public SitemapController(IXmlSitemapRepository sitemapRepository, IMultisiteLogger logger)
            : base(logger)
        {
            this.sitemapRepository = sitemapRepository;
        }

        /// <summary>
        /// Builds Sitemap collection.
        /// </summary>
        /// <param name="sitemapType">Type of sitemap eg. Hotel sitamap, Country sitemap etc.</param>
        /// <returns>Collection of pages grouped by template.</returns>
        public ActionResult GenerateSitemap(string sitemapType = null)
        {
            var language = Sitecore.Context.Language;
            var sitemap = sitemapRepository.BuildSitemap(language, sitemapType);
            return UnlimitedJson(sitemap, JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Builds Index Sitemap collection.
        /// </summary>
        /// <returns>Collection of sitemaps.</returns>
        public ActionResult GenerateIndexSitemap()
        {
            var sitemap = sitemapRepository.BuildIndexSitemap();
            return UnlimitedJson(sitemap, JsonRequestBehavior.AllowGet);
        }
    }
}