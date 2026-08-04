using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using easyJet.Foundation.Presentation.Extensions;
using easyJet.Foundation.Presentation.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Presentation.Pipelines.GetXmlBasedLayoutDefinition
{
    /// <summary>
    /// Add multivariant renderings from page design to layout.
    /// </summary>
    public class AddMultivariantPageDesignsRenderings : BaseAddPartialDesignsRenderings
    {
        private readonly ILayoutXmlService service;

        public AddMultivariantPageDesignsRenderings(ILayoutXmlService service, IHtmlCacheRepository cache)
            : base(cache)
        {
            this.service = service;
        }

        protected Item PageDesign { get; private set; }

        /// <inheritdoc/>
        protected override Item GetPageDesign(Item item)
        {
            PageDesign = item?.GetMultivariantPageDesign();
            return PageDesign;
        }

        /// <inheritdoc/>
        protected override List<XElement> GetRenderings(Item contextItem, Item pageDesign)
        {
            return service.GetRenderings(contextItem, pageDesign).ToList();
        }

        /// <inheritdoc/>
        protected override void MergePartialDesignsRenderings(XElement layout, List<XElement> designRenderings)
        {
            service.MergeMultivaritantRenderings(layout, designRenderings);
        }
    }
}