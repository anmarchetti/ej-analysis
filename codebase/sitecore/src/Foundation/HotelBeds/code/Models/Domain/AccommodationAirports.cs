using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class AccommodationAirports
    {
        [JsonProperty("terminalCode")]
        public string TerminalCode { get; set; }
    }
}