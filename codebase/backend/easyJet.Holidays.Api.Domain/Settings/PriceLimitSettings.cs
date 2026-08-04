using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Settings;

[Serializable]
[DataContract]
public class PriceLimitSettings
{
    [DataMember]
    public double? MaxPrice { get; set; }
    [DataMember]
    public double? MinPrice { get; set; }
    [DataMember]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool IsPricePerPerson { get; set; }
}