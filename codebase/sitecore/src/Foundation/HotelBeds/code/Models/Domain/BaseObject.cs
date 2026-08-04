using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public abstract class BaseObject
    {
        [JsonProperty("code")]
        public string Code { get; set; }
    }
}