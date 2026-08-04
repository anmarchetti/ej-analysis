using System;
using Newtonsoft.Json;

namespace easyJet.Feature.Tracker.Models.Personalize
{
    public class PersonalizeResult
    {
        private const string DefaultResult = "Default";

        [JsonProperty("selectionAttr")]
        public string SelectionAttribute { get; set; } = DefaultResult;

        [JsonProperty("isPreview")]
        public bool IsPreview { get; set; }

        [JsonProperty("Ctas")]
        public PersonalizedCta[] Ctas { get; set; } = Array.Empty<PersonalizedCta>();
    }
}
