using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;

namespace easyJet.Foundation.Multisite.Repositories
{
    [Service(typeof(IXmlSitemapRepository), Lifetime = Lifetime.Singleton)]
    public class XmlSitemapRepository : SitemapRepository, IXmlSitemapRepository
    {
        private static Dictionary<string, List<string>> SitemapMapping => new Dictionary<string, List<string>>
        {
            { Constants.SitemapTypeKeys.Countries, new List<string>() { Templates.DestinationPages.Country } },
            { Constants.SitemapTypeKeys.Regions, new List<string>() { Templates.DestinationPages.Region, Templates.DestinationPages.RegionCity, Templates.DestinationPages.VirtualRegion } },
            { Constants.SitemapTypeKeys.Resorts, new List<string>() { Templates.DestinationPages.Resort } },
            { Constants.SitemapTypeKeys.Hotels,  new List<string>() { Templates.DestinationPages.Hotel } },
        };

        private readonly IMultiSiteContext multiSiteContext;
        private readonly ISitecoreContext context;

        private IEnumerable<ID> TemplatesToExclude
        {
            get
            {
                string key = $"easyJet.Multisite.SitemapSetting.{context.Database.Name}.{context.Site.Name}";
                return Cache.GetOrAdd(key, () =>
                {
                    Item settingsItem = multiSiteContext.GetSettingsItem(context.Database.GetItem(context.Site.StartPath));
                    var sitemapSetting = settingsItem.FirstChildHasTemplate(Constants.TemplateIds.SitemapSetting);

                    if (sitemapSetting != null)
                    {
                        return sitemapSetting.GetItems(Constants.Fields.SitemapSetting.PageTemplatesExclude).Select(x => x.ID);
                    }

                    return Enumerable.Empty<ID>();
                });
            }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="XmlSitemapRepository"/> class.
        /// </summary>
        /// <param name="cache">Cache instance.</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="multiSiteContext">Multisite repository instance.</param>
        /// <param name="context">Sitecore context.</param>
        public XmlSitemapRepository(IHtmlCacheRepository cache, IMultisiteLogger logger, IMultiSiteContext multiSiteContext, ISitecoreContext context)
            : base(cache, logger)
        {
            this.multiSiteContext = multiSiteContext;
            this.context = context;
        }

        /// <inheritdoc/>
        public IEnumerable<SitemapItem> BuildSitemap(Language language, string sitemapType = null)
        {
            try
            {
                string key = $"easyJet.Multisite.XmlSitemap.{sitemapType}.{context.Database.Name}.{context.Site.Name}.{language?.Name}";

                return Cache.GetOrAdd(key, () =>
                {
                    var homeItem = context.Site.GetHomeItem();
                    var sitemap = BuildSitemap(homeItem);

                    if (string.IsNullOrEmpty(sitemapType))
                    {
                        return sitemap.Values.SelectMany(x => x);
                    }

                    // filter by sitemap type
                    sitemapType = sitemapType.ToLower();
                    SitemapMapping.TryGetValue(sitemapType, out var templateIds);
                    if (templateIds != null)
                    {
                        var result = new List<SitemapItem>();
                        foreach (var templateId in templateIds)
                        {
                            if (sitemap.ContainsKey(templateId))
                            {
                                result.AddRange(sitemap[templateId]);
                            }
                        }

                        return result;
                    }

                    return Enumerable.Empty<SitemapItem>();
                });
            }
            catch (Exception ex)
            {
                Logger.Error($"Error occured during building the Sitemap for {context?.Site?.Name} site", ex);
            }

            return Enumerable.Empty<SitemapItem>();
        }

        public IEnumerable<IndexSitemapItem> BuildIndexSitemap()
        {
            try
            {
                var key = $"easyJet.Multisite.XmlIndexSitemap.{context.Database.Name}.{context.Site.Name}";
                return Cache.GetOrAdd(key, () =>
                {
                    var homeItem = context.Site.GetHomeItem();
                    var sitemap = BuildIndexSitemap(homeItem);
                    return sitemap;
                });
            }
            catch (Exception ex)
            {
                Logger.Error($"Error occured during building the Index Sitemap for {context?.Site?.Name} site", ex);
            }

            return Enumerable.Empty<IndexSitemapItem>();
        }

        /// <inheritdoc/>
        protected override bool ShouldBeSkipped(Item item)
        {
            if (TemplatesToExclude.Contains(item.TemplateID))
            {
                return true;
            }

            return base.ShouldBeSkipped(item);
        }
    }
}
