using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class AirportsComputedField : BaseComputedIndexField
    {
        /// <inheritdoc/>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var result = new List<string>();
            var children = indexableItem.Item.GetDescendantsByTemplate(Constants.TemplateIds.Airport);

            foreach (var child in children)
            {
                result.Add(JsonConvert.SerializeObject(new Airport(child), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }));
            }

            return result;
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.AirportsGroup) &&
                 !string.IsNullOrWhiteSpace(indexableItem.Item.Fields[Constants.Fields.DatasourceItem.Code]?.Value);
        }
    }
}