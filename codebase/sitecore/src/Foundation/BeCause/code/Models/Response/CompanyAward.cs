using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Response
{
    [ExcludeFromCodeCoverage]
    public class CompanyAward
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("standardHolderId")]
        public string StandardHolderId { get; set; }

        [JsonProperty("isValidated")]
        public bool IsValidated { get; set; }

        [JsonProperty("startDateUtc")]
        public string StartDateUtc { get; set; }

        [JsonProperty("expiryDateUtc")]
        public string ExpiryDateUtc { get; set; }

        [JsonProperty("standardLevel")]
        public string StandardLevel { get; set; }
    }
}