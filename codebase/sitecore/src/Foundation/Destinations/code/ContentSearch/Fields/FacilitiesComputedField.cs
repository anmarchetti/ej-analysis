using System.Linq;
using easyJet.Foundation.Destinations.Helpers;
using easyJet.Foundation.Destinations.Services;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class FacilitiesComputedField : AccommodationComputedField
    {
        private readonly IVirtualFacilityGroupingService service;

        public FacilitiesComputedField()
        {
            service = new VirtualFacilityGroupingService();
        }

        // For supporting unit testing
        public FacilitiesComputedField(IVirtualFacilityGroupingService service)
        {
            this.service = service;
        }

        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            return ComputeReference(
                indexableItem.Item,
                Constants.TemplateIds.AccommodationFacility,
                Constants.Fields.BaseFacilityItem.FacilityType);
        }

        /// <summary>
        /// Builds JSON collection according virtual group facilities.
        /// </summary>
        /// <param name="indexableItem">indexableItem.</param>
        /// <param name="referenceTypeTemplateId">referenceTypeTemplateId.</param>
        /// <param name="referenceTypeFieldName">referenceTypeFieldName.</param>
        /// <returns>object.</returns>
        protected object ComputeReference(Item indexableItem, ID referenceTypeTemplateId, string referenceTypeFieldName)
        {
            var accommodationFacilities = AccommodationFacilitiesProvider.GetAccommodationFacilities(indexableItem, referenceTypeTemplateId, referenceTypeFieldName);
            var virtualGroup = service.GetAllVirtualFacilities(indexableItem);

            if (accommodationFacilities.Any() && virtualGroup.Any())
            {
                return JsonConvert.SerializeObject(service.MapFacilities(virtualGroup, accommodationFacilities, indexableItem));
            }

            return null;
        }
    }
}