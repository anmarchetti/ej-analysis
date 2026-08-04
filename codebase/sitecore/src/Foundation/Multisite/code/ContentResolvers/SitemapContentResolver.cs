using System.Linq;
using easyJet.Foundation.Multisite.Repositories;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Multisite.ContentResolvers
{
    public class SitemapContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private readonly IHtmlSitemapRepository repository;

        public SitemapContentResolver(IHtmlSitemapRepository repository)
        {
            this.repository = repository;
        }

        /// <summary>
        /// Resolves content for sitemap from sitecore.
        /// </summary>
        /// <param name="rendering">Sitecore rendering.</param>
        /// <param name="renderingConfig">rendering configuration.</param>
        /// <returns>Sitemap.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            Item contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            var sitemapSections = repository.BuildSitemapBySections(contextItem);

            if (sitemapSections == null || !sitemapSections.Any())
            {
                return null;
            }

            return new JObject()
            {
                ["items"] = JArray.FromObject(sitemapSections)
            };
        }
    }
}