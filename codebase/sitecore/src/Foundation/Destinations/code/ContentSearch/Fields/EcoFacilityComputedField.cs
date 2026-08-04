using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class EcoFacilityComputedField : AccommodationComputedField
    {
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var ecoFacility = GetEcoFacility(indexableItem.Item);
            return ecoFacility != null ? JsonConvert.SerializeObject(ecoFacility, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore }) : null;
        }

        private HotelFacility GetEcoFacility(Item indexableItem)
        {
            var items = indexableItem.GetAccommodationReferences(Constants.AccommodationReferences.Facilities);

            if (items == null || !items.Any())
            {
                return null;
            }

            var facilities = items
                .Select(item => new
                {
                    Type = item.GetTargetItem(Constants.Fields.BaseFacilityItem.FacilityType),
                    Item = item
                })
                .Where(x => x.Type != null && (x.Item[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue))
                .Select(x => new FacilityFilteredType(x.Type));

            // if the facility is eco facility.
            var ecoFacility = facilities.FirstOrDefault(x => x.Code.Contains(Constants.Fields.AccommodationFacilityItem.Eco));
            if (ecoFacility != null)
            {
                return new HotelFacility()
                {
                    Name = ecoFacility.Name,
                    FacilityCode = ecoFacility.Code,
                    Tooltip = ecoFacility.Tooltip
                };
            }

            return null;
        }
    }
}