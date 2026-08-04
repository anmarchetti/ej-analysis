using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore;
using Sitecore.ContentSearch;
using Sitecore.Data.Fields;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class VirtualCountryResortsComputedField : BaseComputedIndexField
    {
        /// <summary>
        /// Returns serialized stringCollection of resorts data from indexableitem regions field.
        /// </summary>
        /// <param name="indexableItem">Indexable item.</param>
        /// <returns>Serialized stringCollection of regions data.</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            MultilistField multilist = indexableItem.Item.Fields[Constants.Fields.VirtualDestination.Regions];

            var regionItems = multilist?.GetItems();

            if (regionItems != null && regionItems.Length > 0)
            {
                var result = new List<string>();

                foreach (var regionItem in regionItems)
                {
                    var resortItems = regionItem.GetChildren().Where(x => x.TemplateID == Constants.TemplateIds.Resort);

                    foreach (var resortItem in resortItems)
                    {
                        var region = new Destination
                        {
                            Code = resortItem[Constants.Fields.DatasourceItem.Code],
                            Name = resortItem[Constants.Fields.DatasourceItem.Name],
                            Type = DestinationsMapper.MapRegionTemplateName(resortItem.TemplateName),
                            ShowOnSearchPod = MainUtil.GetBool(regionItem[Constants.Fields.BaseAppearance.ShowOnSearchPod], false)
                        };

                        result.Add(JsonConvert.SerializeObject(region, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }));
                    }
                }

                return result;
            }

            return null;
        }

        /// <inheritdoc/>
        protected internal override bool IsValid(SitecoreIndexableItem indexableItem)
        {
            return indexableItem.Item.TemplateID.Equals(Constants.TemplateIds.VirtualCountry);
        }
    }
}