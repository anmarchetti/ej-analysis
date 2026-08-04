using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Newtonsoft.Json.Linq;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class MasonryCarouselContentResolver : MultiLanguageRenderingResolver, IRenderingContentsResolver
    {
        private readonly IOrderedListItemsManager orderedListItemsManager;

        public MasonryCarouselContentResolver(IOrderedListItemsManager orderedListItemsManager)
        {
            this.orderedListItemsManager = orderedListItemsManager;
        }

        /// <summary>
        /// If the Context Item is the Virtual Region Page resolves items from the Region Related field.
        /// Otherwise gets items by <see cref="RenderingContentsResolver.ItemSelectorQuery"/>query.
        /// </summary>
        /// <param name="rendering">The rendering.</param>
        /// <param name="renderingConfig">The rendering config.</param>
        /// <returns>Data from items in json format.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            var contextItem = GetContextItem(rendering, renderingConfig);
            if (contextItem == null)
            {
                return null;
            }

            JObject jobject = new JObject()
            {
                ["items"] = new JArray()
            };

            var items = GetMasonaryItems(contextItem).CheckVersion(contextItem);
            if (items == null || !items.Any())
            {
                return jobject;
            }

            jobject["items"] = ProcessItems(items, rendering, renderingConfig);
            return jobject;
        }

        /// <summary>
        /// Get masonary items.
        /// Country and Region page gets masonary tiles form ordered list field.
        /// Virtual region, resort gets masonary tiles from multilist field.
        /// </summary>
        /// <param name="contextItem">Context item.</param>
        /// <returns>Collection of masonary tiles.</returns>
        private List<Item> GetMasonaryItems(Item contextItem)
        {
            if (VirtualDestinationsFieldsMap.TryGetValue(contextItem.TemplateID, out var virtualDestinationFieldName))
            {
                MultilistField multilistField = contextItem.Fields[virtualDestinationFieldName];
                return multilistField?.GetItems().ToList();
            }

            if (FieldsMap.TryGetValue(contextItem.TemplateID, out var fieldName))
            {
                return orderedListItemsManager.GetOrderedItems(contextItem, fieldName);
            }

            return new List<Item>();
        }

        private static Dictionary<ID, string> VirtualDestinationsFieldsMap => new Dictionary<ID, string>
        {
            { Constants.TemplateIds.VirtualRegion, Constants.Fields.VirtualDestination.Regions },
            { Constants.TemplateIds.VirtualResort, Constants.Fields.VirtualDestination.Resorts }
        };

        private static Dictionary<ID, string> FieldsMap => new Dictionary<ID, string>
        {
            { Constants.TemplateIds.Country, Constants.Fields.SortingFields.RegionSortOrder },
            { Constants.TemplateIds.RegionPage, Constants.Fields.SortingFields.ResortSortOrder },
            { Constants.TemplateIds.RegionCityPage, Constants.Fields.SortingFields.ResortSortOrder },
        };
    }
}