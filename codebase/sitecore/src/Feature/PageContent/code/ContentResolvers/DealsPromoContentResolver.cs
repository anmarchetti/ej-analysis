using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore.Data.Items;
using Sitecore.Diagnostics;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Feature.PageContent.ContentResolvers
{
    public class DealsPromoContentResolver : RenderingContentsResolver, IRenderingContentsResolver
    {
        private readonly IRequestedSearchesService requestedSearchesService;

        public DealsPromoContentResolver(IRequestedSearchesService requestedSearchesService)
        {
            this.requestedSearchesService = requestedSearchesService;
        }

        /// <summary>
        /// Process collection of deals promo.
        /// </summary>
        /// <param name="items">Datasource child items (Deals promo tiles).</param>
        /// <param name="rendering">Rendering.</param>
        /// <param name="renderingConfig">Rendering Config.</param>
        /// <returns>Collection of items (Deals promo tiles with filled requested search if exist).</returns>
        protected override JArray ProcessItems(IEnumerable<Item> items, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var result = new JArray();
            foreach (Item item in items)
            {
                try
                {
                    var promoTileFields = ProcessItem(item, rendering, renderingConfig);
                    var requestedSearchItem = item.GetTargetItem(Constants.Fields.DealsPromo.RequestedSearch);
                    promoTileFields["RequestedSearch"] = requestedSearchItem != null ?
                        JObject.FromObject(requestedSearchesService.GetRequestedSearchItem(requestedSearchItem)) :
                        null;
                    var processedItem = new JObject()
                    {
                        ["id"] = item.ID.Guid.ToString(),
                        ["name"] = item.Name,
                        ["displayName"] = item.DisplayName,
                        ["fields"] = promoTileFields,
                    };

                    result.Add(processedItem);
                }
                catch (Exception exc)
                {
                    Log.Error($"Error occured while processing deal promo tile: {item?.Name} ({item?.ID})", exc, this);
                }
            }

            return result;
        }
    }
}