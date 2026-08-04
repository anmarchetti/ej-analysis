using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class BaseFacility : BaseObject
    {
        [JsonProperty("facilityCode")]
        public string FacilityCode { get; set; }

        [JsonProperty("facilityGroupCode")]
        public string FacilityGroupCode { get; set; }

        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }

        [JsonProperty("number")]
        public string Number { get; set; }

        [JsonProperty("indYesOrNo")]
        public bool? IndYesOrNo { get; set; }

        [JsonProperty("indLogic")]
        public bool? IndLogic { get; set; }

        [JsonProperty("indFee")]
        public bool IndFee { get; set; }

        [JsonProperty("voucher")]
        public bool Voucher { get; set; }

        [JsonProperty("order")]
        public string Order { get; set; }

        [JsonProperty("amount")]
        public string Amount { get; set; }

        [JsonProperty("currency")]
        public string Currency { get; set; }

        [JsonProperty("applicationType")]
        public string ApplicationType { get; set; }
    }
}