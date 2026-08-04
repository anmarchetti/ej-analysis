using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.Multisite.Logging;
using easyJet.Foundation.Multisite.Models;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.Links;
using Sitecore.Links.UrlBuilders;
using static easyJet.Foundation.Multisite.Constants;

namespace easyJet.Foundation.Multisite.Repositories
{
    public abstract class SitemapRepository
    {
        // Needs for excluding promo pages root prefix.
        private const string PrefixToExclude = "/root";

        protected IMultisiteLogger Logger { get; }

        protected IHtmlCacheRepository Cache { get; }

        private IEnumerable<ID> TemplatesToExcludeChildren { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="SitemapRepository"/> class.
        /// </summary>
        /// <param name="cache">Cache instance.</param>
        /// <param name="logger">Logger instance.</param>
        public SitemapRepository(IHtmlCacheRepository cache, IMultisiteLogger logger)
        {
            Logger = logger;
            Cache = cache;

            var templatesToExcludeChildren = Settings.GetSetting("Multisite.Sitemap.TemplatesToExcludeChildren");
            logger.Debug($"Multisite.Sitemap.TemplatesToExcludeForUi: {templatesToExcludeChildren}", this);

            TemplatesToExcludeChildren = templatesToExcludeChildren.Split(',')
            .Where(id => ID.IsID(id) && !ID.IsNullOrEmpty(new ID(id))).Select(id => new ID(id));
        }

        /// <summary>
        /// Build Sitemap.
        /// </summary>
        /// <param name="rootItem">Root Item.</param>
        /// <returns>Sitemap grouped by templatedId.</returns>
        protected virtual Dictionary<string, List<SitemapItem>> BuildSitemap(Item rootItem)
        {
            var siteMapItems = new Dictionary<string, List<SitemapItem>>(16);
            var pagesQueue = new Queue<Item>();

            if (rootItem == null)
            {
                return siteMapItems;
            }

            if (rootItem.Versions.Count > 0)
            {
                siteMapItems[rootItem.TemplateID.ToString()] = new List<SitemapItem> { new SitemapItem(rootItem) };
            }

            if (rootItem.HasChildren)
            {
                pagesQueue.Enqueue(rootItem);

                while (pagesQueue.Count != 0)
                {
                    foreach (Item child in pagesQueue.Dequeue().Children)
                    {
                        string templateId = child.TemplateID.ToString();
                        if (!ShouldBeSkipped(child) && child.HasVersion() && ShouldBeIncluded(child))
                        {
                            if (!siteMapItems.ContainsKey(templateId))
                            {
                                siteMapItems[templateId] = new List<SitemapItem>();
                            }

                            var siteMapItem = new SitemapItem(child);

                            siteMapItems[templateId].Add(siteMapItem);

                            if (Settings.GetBoolSetting("Multisite.Sitemap.ShouldSupportMultilanguage", false))
                            {
                                siteMapItems[templateId].AddRange(GetItemsForOtherLanguages(child));
                            }
                        }

                        if (!TemplatesToExcludeChildren.Contains(child.TemplateID) && child.HasChildren)
                        {
                            if (!child.IsDestinationItem() || child.HasVersion())
                            {
                                pagesQueue.Enqueue(child);
                            }
                        }
                    }
                }
            }

            return siteMapItems;
        }

        protected virtual List<IndexSitemapItem> BuildIndexSitemap(Item homeItem)
        {
            var languages = homeItem.Languages.Select(i => ItemUtils.GetItemInLanguage(homeItem, i))
                .Where(i => i.Versions.Count > 0).Select(i => i.Language).ToList();

            var returnList = new List<IndexSitemapItem>();
            foreach (var language in languages)
            {
                returnList.Add(BuildIndexSitemapItem(language, $"/sitemap.xml"));
                returnList.Add(BuildIndexSitemapItem(language, BuildXmlPath(SitemapTypeKeys.Countries)));
                returnList.Add(BuildIndexSitemapItem(language, BuildXmlPath(SitemapTypeKeys.Regions)));
                returnList.Add(BuildIndexSitemapItem(language, BuildXmlPath(SitemapTypeKeys.Resorts)));
                returnList.Add(BuildIndexSitemapItem(language, BuildXmlPath(SitemapTypeKeys.Hotels)));
            }

            return returnList;
        }

        /// <summary>
        /// Checks that item should be skipped from Sitemap.
        /// </summary>
        /// <param name="item">Sitecore page item.</param>
        /// <returns>True if the item should be skipped from Sitemap.</returns>
        protected virtual bool ShouldBeSkipped(Item item)
        {
            LookupField changeFrequencyField = item.Fields[Constants.Fields.SitemapBase.ChangeFrequency];
            var sitemapChangeFrequency = (SitemapChangeFrequency)MainUtil.GetInt(changeFrequencyField?.TargetItem?.Fields[Constants.Fields.SitecoreProperty.Value].Value, 0);

            return sitemapChangeFrequency == SitemapChangeFrequency.DoNotInclude || string.IsNullOrWhiteSpace(item.Fields[FieldIDs.LayoutField]?.Value);
        }

        /// <summary>
        /// Checks that item is should be included to sitemap (do not have robots tags, redirect url and item url match with canonical url).
        /// </summary>
        /// <param name="item">Sitecore page item.</param>
        /// <returns>True if the item should be included to Sitemap.</returns>
        protected virtual bool ShouldBeIncluded(Item item)
        {
            return string.IsNullOrWhiteSpace(item[Constants.Fields.BasePage.Robots]) &&
                   item.TemplateID != Constants.TemplateIds.NotFoundPage &&
                   string.IsNullOrWhiteSpace(item.LinkFieldUrl(Constants.Fields.BasePage.RedirectUrl)) &&
                   IsMatchWithCanonicalUrl(item);
        }

        private static string BuildXmlPath(string xmlName)
        {
            return $"/sitemap-xml/{xmlName.ToLowerInvariant()}.xml";
        }

        private static IndexSitemapItem BuildIndexSitemapItem(Language language, string xmlPath)
        {
            var countrySiteMapSitemapEntry = new IndexSitemapItem()
            {
                Url = xmlPath,
                Language = language.Name
            };

            return countrySiteMapSitemapEntry;
        }

        /// <summary>
        /// Get Items for other languages.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Collection of langugage items.</returns>
        private IEnumerable<SitemapItem> GetItemsForOtherLanguages(Item item)
        {
            foreach (Language language in item.Languages.Where(language => language != item.Language))
            {
                var langItem = item.Database.GetItem(item.ID, language);
                if (langItem.Versions.Count > 0)
                {
                    yield return new SitemapItem(langItem);
                }
            }
        }

        /// <summary>
        /// Checks that the item url matches with canonical url.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>True if the canonical url matches with item's url.</returns>
        private bool IsMatchWithCanonicalUrl(Item item)
        {
            if (string.IsNullOrWhiteSpace(item[Constants.Fields.BasePage.CanonicalUrl]))
            {
                return true;
            }

            var canonicalUrl = item[Constants.Fields.BasePage.CanonicalUrl].ToLower().Trim();
            // Getting page url and excluding root prefix if page url contains prefix.
            var pageUrl = item.GetItemUrl().ToLower().Trim().Replace(PrefixToExclude, string.Empty).Substring(1);

            return canonicalUrl == pageUrl;
        }
    }
}
