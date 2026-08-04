using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings;

/// <summary>
/// Sitecore settings for promo code.
/// </summary>
[Serializable]
[DataContract]
public class PromoCodeSettings
{
    /// <summary>
    /// True if we should include seats price in promo code price tier
    /// False if we should not include seats price
    /// </summary>
    [DataMember]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool IsSeatsCalculationIncluded { get; set; }

    /// <summary>
    /// Is promo code can be apply to booking.
    /// </summary>
    [DataMember]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool IsPromoCodeEnabled { get; set; }

    /// <summary>
    /// Promo code for FlightExtrasSearch Atcom requests
    /// </summary>
    [DataMember]
    public string FlightExtrasSearchPromoCode { get; set; }
}