using System.Collections.Generic;
using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Personalize
{
    public class PersonalizeRequest
    {
        [JsonProperty("clientKey")]
        public string ClientKey { get; set; }

        [JsonProperty("channel")]
        public string Channel { get; set; }

        [JsonProperty("language")]
        public string Language { get; set; }

        [JsonProperty("currencyCode")]
        public string CurrencyCode { get; set; }

        [JsonProperty("pointOfSale")]
        public string PointOfSale { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("browserId")]
        public string BrowserId { get; set; }

        [JsonProperty("friendlyId")]
        public string FriendlyId { get; set; }

        [JsonProperty("params")]
        public Dictionary<string, object> CustomParameters { get; set; } = new Dictionary<string, object>();
    }
}
