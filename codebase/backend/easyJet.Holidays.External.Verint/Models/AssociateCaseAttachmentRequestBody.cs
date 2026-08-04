using Newtonsoft.Json;

namespace easyJet.Holidays.External.Verint.Models
{
    public class AssociateCaseAttachmentRequestBody
    {
        [JsonProperty("@type")]
        public string Type { get; set; }

        [JsonProperty("vatt:identifier")]
        public string Identifier { get; set; }

        [JsonProperty("vatt:description")]
        public string Description { get; set; }
    }
}