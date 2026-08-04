using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class FacilityTypology : BaseObject
    {
        [JsonProperty("numberFlag")]
        public bool NumberFlag { get; set; }

        [JsonProperty("logicFlag")]
        public bool LogicFlag { get; set; }

        [JsonProperty("feeFlag")]
        public bool FeeFlag { get; set; }

        [JsonProperty("distanceFlag")]
        public bool DistanceFlag { get; set; }

        [JsonProperty("ageFromFlag")]
        public bool AgeFromFlag { get; set; }

        [JsonProperty("ageToFlag")]
        public bool AgeToFlag { get; set; }

        [JsonProperty("dateFromFlag")]
        public bool DateFromFlag { get; set; }

        [JsonProperty("dateToFlag")]
        public bool DateToFlag { get; set; }

        [JsonProperty("timeFromFlag")]
        public bool TimeFromFlag { get; set; }

        [JsonProperty("timeToFlag")]
        public bool TimeToFlag { get; set; }

        [JsonProperty("indYesOrNoFlag")]
        public bool IndYesOrNoFlag { get; set; }

        [JsonProperty("amountFlag")]
        public bool AmountFlag { get; set; }

        [JsonProperty("currencyFlag")]
        public bool CurrencyFlag { get; set; }

        [JsonProperty("appTypeFlag")]
        public bool AppTypeFlag { get; set; }

        [JsonProperty("textFlag")]
        public bool TextFlag { get; set; }
    }
}