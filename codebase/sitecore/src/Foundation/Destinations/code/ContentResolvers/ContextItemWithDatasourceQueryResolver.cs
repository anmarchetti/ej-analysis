using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class ContextItemWithDatasourceQueryResolver : MultiLanguageRenderingResolver, IRenderingContentsResolver
    {
        /// <summary>
        /// If the Context Item is the Virtual Region/Resort Page resolves items from the Region/Resort Related field.
        /// Otherwise gets items by <see cref="RenderingContentsResolver.ItemSelectorQuery"/>query.
        /// </summary>
        /// <param name="rendering">The rendering.</param>
        /// <param name="renderingConfig">The rendering config.</param>
        /// <returns>Data from items in json format.</returns>
        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            // get context item
            var contextItem = Context.Item.HasVersion() ? Context.Item : null;
            if (contextItem == null)
            {
                return null;
            }

            var result = ProcessItem(contextItem, rendering, renderingConfig);

            // get configured datasource if exists
            var datasourceItem = GetContextItem(rendering, renderingConfig);
            if (datasourceItem != null)
            {
                result.Add("datasourceItem", ProcessItem(datasourceItem, rendering, renderingConfig));
            }

            result.Add("items", new JArray());

            string relatedItemsMultilistFieldName = null;

            if (contextItem.TemplateID == Constants.TemplateIds.VirtualRegion)
            {
                relatedItemsMultilistFieldName = Constants.Fields.VirtualDestination.Regions;
            }
            else if (contextItem.TemplateID == Constants.TemplateIds.VirtualResort)
            {
                relatedItemsMultilistFieldName = Constants.Fields.VirtualDestination.Resorts;
            }

            if (string.IsNullOrEmpty(relatedItemsMultilistFieldName))
            {
                var items = GetItemsFromQueryAndParameters(contextItem);
                if (items == null || items.Length == 0)
                {
                    return result;
                }

                result["items"] = ProcessItems(items, rendering, renderingConfig);
                return result;
            }

            MultilistField field = contextItem.Fields[relatedItemsMultilistFieldName];
            var relatedItems = field?.GetItems();
            if (relatedItems != null && relatedItems.Length != 0)
            {
                result["items"] = ProcessItems(relatedItems, rendering, renderingConfig);
            }

            return result;
        }

        private Item[] GetItemsFromQueryAndParameters(Item contextItem)
        {
            if (string.IsNullOrEmpty(ItemSelectorQuery))
            {
                return Array.Empty<Item>();
            }

            var itemsToTakeParameter = Parameters["itemstotake"];
            if (string.IsNullOrEmpty(itemsToTakeParameter))
            {
                return contextItem.Axes.SelectItems(ItemSelectorQuery);
            }

            int.TryParse(itemsToTakeParameter, out var itemsToTake);

            var items = contextItem.Axes
                .SelectItems(ItemSelectorQuery)
                ?.CheckVersion(contextItem)
                .Take(itemsToTake)
                .ToArray();

            return items;
        }
    }
}