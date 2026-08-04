using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Mvc.Pipelines.Response.GetXmlBasedLayoutDefinition;
using Sitecore.Mvc.Presentation;
using Sitecore.Web;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    public abstract class BaseAddPartialDesignsRenderings : SiteSpecificProcessor
    {
        private readonly IHtmlCacheRepository cache;

        protected BaseAddPartialDesignsRenderings(IHtmlCacheRepository cache)
        {
            this.cache = cache;
        }

        /// <summary>
        /// Process pipeline which merge partial designs with context layout.
        /// </summary>
        /// <param name="args">Context item layout arguments.</param>
        public override void HandleRequest(GetXmlBasedLayoutDefinitionArgs args)
        {
            var contextItem = args.ContextItem ?? PageContext.Current.Item;

            var pageDesign = GetPageDesign(contextItem);
            if (pageDesign == null && !contextItem.HasBaseTemplate(new TemplateID(Templates.PartialDesign.Id)))
            {
                return;
            }

            var designId = pageDesign != null ? pageDesign.ID : contextItem.ID;
            var siteInfo = Context.Site.SiteInfo;
            var renderings = cache.GetItem<List<XElement>>(CreateLayoutXmlCacheKey(designId, siteInfo));

            if (renderings != null && Context.PageMode.IsNormal)
            {
                MergePartialDesignsRenderings(args.Result, renderings);
            }
            else
            {
                List<XElement> list = GetRenderings(contextItem, pageDesign);
                if (!list.Any())
                {
                    return;
                }

                MergePartialDesignsRenderings(args.Result, list);

                cache.StoreItem(CreateLayoutXmlCacheKey(designId, siteInfo), list);
            }
        }

        /// <summary>
        /// Get page design based on passed item.
        /// </summary>
        /// <param name="item">Sitecore Item.</param>
        /// <returns>Page Design Item.</returns>
        protected abstract Item GetPageDesign(Item item);

        /// <summary>
        /// Merge parital designs with layout.
        /// </summary>
        /// <param name="layout">Context item layout.</param>
        /// <param name="designRenderings">Design renderings.</param>
        protected abstract void MergePartialDesignsRenderings(XElement layout, List<XElement> designRenderings);

        /// <summary>
        /// Get renderings from context item and page designs.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <param name="pageDesign">Page Design Item.</param>
        /// <returns>Collections of renderings in xml format.</returns>
        protected abstract List<XElement> GetRenderings(Item contextItem, Item pageDesign);

        /// <summary>
        /// Create layout xml cache key.
        /// </summary>
        /// <param name="designId">Design id.</param>
        /// <param name="site">Site info.</param>
        /// <returns>Cache key.</returns>
        private string CreateLayoutXmlCacheKey(ID designId, SiteInfo site)
        {
            return site != null && !designId.IsNull ? $"{site.Name}::{site.Database}::{site.Device}::{site.Language}::{designId}" : string.Empty;
        }
    }
}