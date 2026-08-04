using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class AirportCodesComputedField : BaseComputedIndexField
    {
        private static readonly HashSet<ID> TemplatesToExcludeChildren = new HashSet<ID>()
        {
            Constants.TemplateIds.PageComponentsFolder,
            Constants.TemplateIds.Accommodation,
        };

        /// <summary>
        /// Return unique Airports by id.
        /// </summary>
        /// <param name="indexableItem">Indexable item.</param>
        /// <returns>Unique Airports by id.</returns>
        protected internal virtual Item[] GetAirports(Item indexableItem)
        {
            if (indexableItem.TemplateID == Constants.TemplateIds.Accommodation)
            {
                MultilistField multilist = indexableItem.Fields[Constants.Fields.AccommodationItem.Airports];
                return multilist.GetItems();
            }

            if (indexableItem.TemplateID == Constants.TemplateIds.Country ||
                indexableItem.TemplateID == Constants.TemplateIds.Location ||
                indexableItem.TemplateID == Constants.TemplateIds.LocationCity ||
                indexableItem.TemplateID == Constants.TemplateIds.Resort)
            {
                return GetAirportsFromChildrenItems(indexableItem)
                    .GroupBy(a => a.ID)
                    .Select(g => g.First())
                    .ToArray();
            }

            if (indexableItem.IsVirtualDestinationItem(VirtualDestinationTypes.Country | VirtualDestinationTypes.Region))
            {
                return GetUniqueAirportsFromMultilist(indexableItem, Constants.Fields.VirtualDestination.Regions);
            }
            else if (indexableItem.IsVirtualDestinationItem(VirtualDestinationTypes.Resort))
            {
                return GetUniqueAirportsFromMultilist(indexableItem, Constants.Fields.VirtualDestination.Resorts);
            }

            return new Item[0];
        }

        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var airports = GetAirports(indexableItem.Item);
            return airports.Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value).ToArray();
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.IsDestinationItem()
                || indexableItem.Item.IsVirtualDestinationItem();
        }

        private Item[] GetUniqueAirportsFromMultilist(Item item, string multilistFieldId)
        {
            var multilist = (MultilistField)item.Fields[multilistFieldId];

            var relatedItems = multilist?.GetItems();

            if (relatedItems == null)
            {
                return Array.Empty<Item>();
            }

            return relatedItems
                .SelectMany(GetAirportsFromChildrenItems)
                .GroupBy(a => a.ID)
                .Select(g => g.First())
                .ToArray();
        }

        /// <summary>
        /// Return airports from parent's children.
        /// </summary>
        /// <param name="parent">Parent item.</param>
        /// <returns>Airports from parent's children.</returns>
        private List<Item> GetAirportsFromChildrenItems(Item parent)
        {
            var hotels = GetAccommodationItems(parent);

            return hotels.SelectMany(h => ((MultilistField)h.Fields[Constants.Fields.AccommodationItem.Airports])?.GetItems() ?? Array.Empty<Item>()).ToList();
        }

        private List<Item> GetAccommodationItems(Item rootItem)
        {
            var accommodationtemItem = new List<Item>();
            var pagesQueue = new Queue<Item>();

            if (rootItem.HasChildren)
            {
                pagesQueue.Enqueue(rootItem);

                while (pagesQueue.Count != 0)
                {
                    foreach (Item child in pagesQueue.Dequeue().GetChildren(Sitecore.Collections.ChildListOptions.SkipSorting))
                    {
                        if (child.TemplateID.Equals(Constants.TemplateIds.Accommodation))
                        {
                            accommodationtemItem.Add(child);
                        }

                        if (!TemplatesToExcludeChildren.Contains(child.TemplateID) && child.HasChildren)
                        {
                            pagesQueue.Enqueue(child);
                        }
                    }
                }
            }

            return accommodationtemItem;
        }
    }
}