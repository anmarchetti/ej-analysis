using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings
{
    [Serializable]
    [DataContract]
    public class OtherRoutesSettingsSitecore
    {
        [DataMember(Name = "EnableOtherRoutes")]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableOtherRoutes { get; set; }

        [DataMember(Name = "OpenRouteInNewTab")]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool OpenRouteInNewTab { get; set; }

        [DataMember(Name = "EnableOtherRoutesInPromoPages")]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableOtherRoutesInPromoPages { get; set; }

    }
}
