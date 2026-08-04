using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace easyJet.Foundation.Optimizely.Models
{
    public class OptimizelyDecisionContextModel
    {
        [JsonProperty("featureKey")]
        public string FeatureKey { get; set; }

        [JsonProperty("variationKey")]
        public string VariationKey { get; set; }

        [JsonProperty("experimentKey")]
        public string ExperimentKey { get; set; }

        [JsonProperty("isDisabled")]
        public bool IsDisabled { get; set; }

        [JsonProperty("source")]
        [JsonConverter(typeof(StringEnumConverter))]
        public OptimizelyDecisionSource Source { get; set; }
    }
}
