using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public enum PhoneType
    {
        PHONEBOOKING,
        PHONEHOTEL,
        PHONEMANAGEMENT,
        FAXNUMBER
    }

    public class Phone
    {
        [JsonProperty("phoneNumber")]
        public string Number { get; set; }

        [JsonProperty("phoneType")]
        public PhoneType Type { get; set; }
    }
}