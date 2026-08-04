using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Personalize
{
    public class Personalization
    {
        [JsonProperty("friendlyId")]
        public string FriendlyId { get; set; }

        [JsonProperty("selectionAttr")]
        public string SelectionAttr { get; set; }

        [JsonProperty("uniqueId")]
        public string UniqueId { get; set; }

        [JsonProperty("Ctas")]
        public PersonalizedCta[] Ctas { get; set; }
    }
}
