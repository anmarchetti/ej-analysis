using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class FacilityGroup : BaseObject
    {
        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }
    }
}