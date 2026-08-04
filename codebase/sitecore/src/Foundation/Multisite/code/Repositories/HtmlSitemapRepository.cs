using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Multisite.Repositories
{
    [Service(typeof(IHtmlSitemapRepository), Lifetime = DependencyInjection.Lifetime.Transient)]
    public class HtmlSitemapRepository : SitemapRepository, IHtmlSitemapRepository
    {
        private static readonly ConcurrentDictionary<string, Lazy<Dictionary<string, List<SitemapItem>>>> SitemapBuildLocks = new ConcurrentDictionary<string, Lazy<Dictionary<string, List<SitemapItem>>>>();
        private readonly ISitecoreContext context;

        private IEnumerable<ID> TemplatesToExclude { get; }

        private static IEnumerable<SitemapItem> ApplyRootFilter(Item sectionItem, Item sitemapSectionsSettingItem, IEnumerable<SitemapItem> pagesByTemplates)
        {
            var roots = sectionItem.GetItems(Constants.Fields.SitemapBase.Roots);
            if (!roots.Any())
            {
                return pagesByTemplates;
            }

            var rootUrls = roots
                .CheckVersion(sitemapSectionsSettingItem)
                .Select(x => x.GetItemUrl())
                .Where(x => !string.IsNullOrEmpty(x))
                .ToHashSet();

            return rootUrls.Any()
                ? pagesByTemplates.Where(page => rootUrls.Any(rootUrl => !string.IsNullOrEmpty(page.Url) && page.Url.StartsWith(rootUrl + "/", StringComparison.OrdinalIgnoreCase)))
                : Array.Empty<SitemapItem>();
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="HtmlSitemapRepository"/> class.
        /// </summary>
        /// <param name="cache">Cache instance.</param>
        /// <param name="logger">Logger instance.</param>
        /// <param name="context">Sitecore Context.</param>
        public HtmlSitemapRepository(IHtmlCacheRepository cache, IMultisiteLogger logger, ISitecoreContext context)
            : base(cache, logger)
        {
            this.context = context;

            var templatesToExclude = Settings.GetSetting("Multisite.Sitemap.TemplatesToExclude");
            logger.Debug($"Multisite.Sitemap.TemplatesToExcludeForUi: {templatesToExclude}", this);

            TemplatesToExclude = templatesToExclude.Split(',')
                .Where(id => ID.IsID(id) && !ID.IsNullOrEmpty(new ID(id))).Select(id => new ID(id));
        }

        /// <inheritdoc/>
        public List<SitemapSection> BuildSitemapBySections(Item sitemapSectionsSettingItem, params Item[] sectionItems)
        {
            try
            {
                string key = $"easyJet.Multisite.HtmlSitemap.{context.Database.Name}.{context.Site.Name}.{sitemapSectionsSettingItem.ID}";

                return Cache.GetOrAdd(key, () =>
                {
                    var sitemap = BuildSitemap();
                    var validTemplateIDs = sitemap.Keys.ToHashSet();

                    var sitemapSection = new List<SitemapSection>();
                    var selectedSections = sectionItems.Any() ? sectionItems : sitemapSectionsSettingItem.GetItems(Constants.Fields.SitemapBlock.Sections);

                    foreach (Item sectionItem in selectedSections)
                    {
                        var pages = BuildSectionPages(sectionItem, sitemapSectionsSettingItem, sitemap, validTemplateIDs);

                        var section = new SitemapSection(sectionItem)
                        {
                            Pages = pages
                        };

                        sitemapSection.Add(section);
                    }

                    return sitemapSection;
                });
            }
            catch (Exception ex)
            {
                Logger.Error($"Error occured during building the Sitemap for {context?.Site?.Name} site", ex);
            }

            return new List<SitemapSection>();
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

        private Dictionary<string, List<SitemapItem>> BuildSitemap()
        {
            string key = $"easyJet.Multisite.HtmlSitemap.Tree.{context.Database.Name}.{context.Site.Name}";

            var lazyBuild = SitemapBuildLocks.GetOrAdd(
                key,
                cacheKey => new Lazy<Dictionary<string, List<SitemapItem>>>(
                    () => Cache.GetOrAdd(cacheKey, () => BuildSitemap(context.Site.GetHomeItem())),
                    LazyThreadSafetyMode.ExecutionAndPublication));

            try
            {
                return lazyBuild.Value;
            }
            finally
            {
                SitemapBuildLocks.TryRemove(key, out _);
            }
        }

        private IEnumerable<SitemapItem> BuildSectionPages(Item sectionItem, Item sitemapSectionsSettingItem, Dictionary<string, List<SitemapItem>> sitemap, HashSet<string> validTemplateIDs)
        {
            var templateIds = sectionItem.GetItems(Constants.Fields.SitemapBase.PageTemplates)
                .Where(x => validTemplateIDs.Contains(x.ID.ToString()))
                .Select(x => x.ID.ToString())
                .ToHashSet();

            var specificPages = sectionItem
                .GetItems(Constants.Fields.SitemapBase.Pages)
                .CheckVersion(sitemapSectionsSettingItem)
                .Where(x => ShouldBeIncluded(x))
                .Select(x => new SitemapItem(x));

            var pagesByTemplates = templateIds.SelectMany(templateId => sitemap[templateId]);
            pagesByTemplates = ApplyRootFilter(sectionItem, sitemapSectionsSettingItem, pagesByTemplates);

            // merge pages from 'PageTemplates' field and 'Pages' field.
            if (specificPages.Any())
            {
                pagesByTemplates = pagesByTemplates.Concat(specificPages);
            }

            var pages = pagesByTemplates
                .Where(x => x != null)
                .GroupBy(x => x.ID)
                .Select(x => x.FirstOrDefault())
                .Where(x => x != null);

            return MainUtil.GetBool(sectionItem[Constants.Fields.SitemapBase.IsSorted], false)
                ? pages.OrderBy(x => x.PageTitle)
                : pages;
        }
    }
}
