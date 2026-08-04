using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Extensions;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    /// <summary>
    /// Represents Parents Computed Field
    /// Collects array of parent objects in JSON format.
    /// </summary>
    public class ParentsComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var parents = new List<string>();

            if (indexableItem.Item.TemplateID == Constants.TemplateIds.VirtualCountry)
            {
                var country = ((MultilistField)indexableItem.Item.Fields[Constants.Fields.VirtualDestination.Regions]).GetItems().FirstOrDefault()?.Parent;

                if (country != null)
                {
                    parents.Add(SerilizeDestination(country));
                }

                return parents;
            }

            var parent = indexableItem.Item.Parent;
            while (parent.IsDestinationItem())
            {
                parents.Add(SerilizeDestination(parent));
                parent = parent.Parent;
            }

            return parents;
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
            => indexableItem.Item.IsDestinationItem() ||
                indexableItem.Item.IsVirtualDestinationItem();

        private static string SerilizeDestination(Item item) => JsonConvert.SerializeObject(
            new Destination
            {
                Code = item[Constants.Fields.DatasourceItem.Code],
                Name = item[Constants.Fields.DatasourceItem.Name],
                ItemName = item.Name,
                Type = DestinationsMapper.MapRegionTemplateName(item.TemplateName),
            }, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
    }
}