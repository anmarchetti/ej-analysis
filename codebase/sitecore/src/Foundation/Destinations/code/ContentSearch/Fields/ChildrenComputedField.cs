using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Sitecore;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Represents Children Computed Field
    /// Collects array of children objects in JSON format.
    /// </summary>
    public class ChildrenComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var result = new List<string>();
            var children = GetChildrenItem(indexableItem.Item).CheckVersion(indexableItem.Item);
            foreach (var child in children)
            {
                if (!child.IsDestinationItem() && !child.IsVirtualDestinationItem(VirtualDestinationTypes.Region | VirtualDestinationTypes.Resort))
                {
                    continue;
                }

                var destination = new Destination
                {
                    Code = child[Constants.Fields.DatasourceItem.Code],
                    Name = child[Constants.Fields.DatasourceItem.Name],
                    ItemName = child.Name,
                    Type = DestinationsMapper.MapRegionTemplateName(child.TemplateName),
                    ShowOnSearchPod = MainUtil.GetBool(child[Constants.Fields.BaseAppearance.ShowOnSearchPod], false),
                    ShowOnDropdown = MainUtil.GetBool(child[Constants.Fields.BaseAppearance.ShowOnDropdown], false),
                    ShowInAutocomplete = MainUtil.GetBool(child[Constants.Fields.BaseAppearance.ShowInAutocomplete], false),
                    TrackingId = ItemUtils.GetTrackingId(child)
                };

                if (child.IsVirtualDestinationItem(VirtualDestinationTypes.Region))
                {
                    destination.RelatedRegions = ((MultilistField)child.Fields[Constants.Fields.VirtualDestination.Regions])?.GetItems()?.Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value);
                }

                if (child.IsVirtualDestinationItem(VirtualDestinationTypes.Resort))
                {
                    destination.RelatedResorts = ((MultilistField)child.Fields[Constants.Fields.VirtualDestination.Resorts])?.GetItems()?.Select(x => x.Fields[Constants.Fields.DatasourceItem.Code]?.Value);
                }

                result.Add(JsonConvert.SerializeObject(destination, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }));
            }

            return result;
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.Country)
                || indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.Location)
                || indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.LocationCity);
        }

        /// <summary>
        /// Get children item.
        /// </summary>
        /// <param name="item">Parent item.</param>
        /// <returns>Collection of children.</returns>
        private Item[] GetChildrenItem(Item item)
        {
            // sort only country sub-items by display name.
            if (item.TemplateID.Equals(Constants.TemplateIds.Country))
            {
                return item.Children.OrderBy(x => x.DisplayName).ToArray();
            }

            return item.Children.ToArray();
        }
    }
}