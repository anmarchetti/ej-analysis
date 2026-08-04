using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Extensions;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Fields
{
    public class FilteredFacilitiesComputedField : AccommodationComputedField
    {
        private readonly IFacilityHeadersService facilityHeadersService;

        public FilteredFacilitiesComputedField()
        {
            facilityHeadersService = new FacilityHeadersService();
        }

        // For supporting unit testing
        public FilteredFacilitiesComputedField(IFacilityHeadersService facilityHeadersService)
        {
            this.facilityHeadersService = facilityHeadersService;
        }

        /// <summary>
        /// Builds JSON facility headers collection with avaliable (ShowOnSite is checked and ShowInFilter is checked) facilities.
        /// </summary>
        /// <param name="indexableItem">indexableItem.</param>
        /// <returns>object.</returns>
        protected internal override object ComputeField(SitecoreIndexableItem indexableItem)
        {
            var item = indexableItem.Item;
            var faciltites = GetAccommodationFacilities(item);

            if (!faciltites.Any())
            {
                return null;
            }

            var facilityHeaders = facilityHeadersService.GetFacilityHeaders(item);

            if (facilityHeaders.Any())
            {
                List<string> result = new List<string>();

                facilityHeadersService
                    .MapFacilityHeaders(facilityHeaders, faciltites)
                    .ForEach(x =>
                    {
                        result.Add(JsonConvert.SerializeObject(x));
                    });

                return result;
            }

            return null;
        }

        private IEnumerable<FacilityFilteredType> GetAccommodationFacilities(Item indexableItem)
        {
            var items = indexableItem.GetAccommodationReferences(Constants.AccommodationReferences.Facilities);

            if (items == null || !items.Any())
            {
                return new List<FacilityFilteredType>();
            }

            var facilities = items
                .Select(item => new
                {
                    Type = item.GetTargetItem(Constants.Fields.BaseFacilityItem.FacilityType),
                    Item = item
                })
                .Where(x => x.Type != null &&
                    (x.Type[Constants.Fields.FacilityTypeItem.ShowInFilter] == Constants.Common.CheckboxTrueValue) &&
                    (x.Item[Constants.Fields.BaseAppearance.ShowOnSite] == Constants.Common.CheckboxTrueValue))
                .Select(x => new FacilityFilteredType(x.Type));

            return facilities;
        }
    }
}