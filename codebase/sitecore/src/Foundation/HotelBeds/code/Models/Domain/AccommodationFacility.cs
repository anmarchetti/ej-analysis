using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class AccommodationFacility : BaseFacility
    {
        [JsonProperty("distance")]
        public string Distance { get; set; }

        [JsonProperty("ageFrom")]
        public string AgeFrom { get; set; }

        [JsonProperty("ageTo")]
        public string AgeTo { get; set; }

        [JsonProperty("textValue")]
        public string TextValue { get; set; }

        [JsonProperty("dateFrom")]
        public string DateFrom { get; set; }

        [JsonProperty("dateTo")]
        public string DateTo { get; set; }

        [JsonProperty("timeFrom")]
        public string TimeFrom { get; set; }

        [JsonProperty("timeTo")]
        public string TimeTo { get; set; }
    }
}