using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Facility : BaseObject
    {
        [JsonProperty("facilityGroupCode")]
        public string FacilityGroupCode { get; set; }

        [JsonProperty("facilityTypologyCode")]
        public string FacilityTypologyCode { get; set; }

        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }
    }
}