using Newtonsoft.Json;

namespace easyJet.Holidays.External.Verint.Models
{
    public class CreateCaseRequestBody
    {
        [JsonProperty("caseTypeName")]
        public string CaseTypeName { get; set; }

        [JsonProperty("caseSummary")]
        public string CaseSummary { get; set; }

        [JsonProperty("customerEmailAddress")]
        public string CustomerEmailAddress { get; set; }

        [JsonProperty("customerFirstName")]
        public string CustomerFirstName { get; set; }

        [JsonProperty("customerLastName")]
        public string CustomerLastName { get; set; }

        [JsonProperty("caseNotes")]
        public string CaseNotes { get; set; }

        [JsonProperty("bookingReference")]
        public string BookingReference { get; set; }

        [JsonProperty("language")]
        public string Language { get; set; }
    }
}