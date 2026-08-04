using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Models.Responses
{
    public class HotelFacilitiesResponse
    {
        public HotelFacilitiesResponse(Dictionary<string, List<FacilityType>> facilities)
        {
            Facilities = facilities ?? new Dictionary<string, List<FacilityType>>();
        }

        public Dictionary<string, List<FacilityType>> Facilities { get; set; }
    }
}