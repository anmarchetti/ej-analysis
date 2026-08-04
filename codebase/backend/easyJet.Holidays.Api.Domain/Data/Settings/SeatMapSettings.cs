using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class SeatMapSettings
    {
        [DataMember]
        public int TimeDisplayBannerTapSelectedSeatToRemoveIt { get; set; }

        [DataMember]
        public int MinNumberOfDaysToDeparture { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableSeatMapFlow { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableSeatMapPostBookingFlow { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableSeatMapDateChange { get; set; }
    }
}
