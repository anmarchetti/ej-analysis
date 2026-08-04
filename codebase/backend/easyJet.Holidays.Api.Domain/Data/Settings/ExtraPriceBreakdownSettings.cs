using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings;

/// <summary>
/// Sitecore settings for Extra Price Breakdown.
/// </summary>
[Serializable]
[DataContract]
public class ExtraPriceBreakdownSettings
{
    /// <summary>
    /// Code for the Extras category
    /// </summary>
    [DataMember(Name = "ExtrasCode")]
    public string ExtrasCode { get; set; }

    /// <summary>
    /// Text for the Extras category
    /// </summary>
    [DataMember(Name = "ExtrasText")]
    public string ExtrasText { get; set; }

    /// <summary>
    /// Include seats price to extras if true
    /// </summary>
    [DataMember(Name = "SeatsPriceEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool SeatsPriceEnabled { get; set; }

    /// <summary>
    /// Code for the Seats Price category
    /// </summary>
    [DataMember(Name = "SeatsPriceCode")]
    public string SeatsPriceCode { get; set; }

    /// <summary>
    /// Text for the Seats Price category
    /// </summary>
    [DataMember(Name = "SeatsPriceText")]
    public string SeatsPriceText { get; set; }

    /// <summary>
    /// Include large cabin bags price to extras if true
    /// </summary>
    [DataMember(Name = "LargeCabinBagsPriceEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool LargeCabinBagsPriceEnabled { get; set; }

    /// <summary>
    /// Code for the Large Cabin Bags Price category
    /// </summary>
    [DataMember(Name = "LargeCabinBagsPriceCode")]
    public string LargeCabinBagsPriceCode { get; set; }

    /// <summary>
    /// Text for the Large Cabin Bags Price category
    /// </summary>
    [DataMember(Name = "LargeCabinBagsPriceText")]
    public string LargeCabinBagsPriceText { get; set; }

    /// <summary>
    /// Include hold luggage price to extras if true
    /// </summary>
    [DataMember(Name = "HoldLuggagePriceEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool HoldLuggagePriceEnabled { get; set; }

    /// <summary>
    /// Code for the Hold Luggage Price category
    /// </summary>
    [DataMember(Name = "HoldLuggagePriceCode")]
    public string HoldLuggagePriceCode { get; set; }

    /// <summary>
    /// Text for the Hold Luggage Price category
    /// </summary>
    [DataMember(Name = "HoldLuggagePriceText")]
    public string HoldLuggagePriceText { get; set; }

    /// <summary>
    /// Include late checkout price to extras if true
    /// </summary>
    [DataMember(Name = "LateCheckoutPriceEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool LateCheckoutPriceEnabled { get; set; }

    /// <summary>
    /// Code for the Late Checkout category
    /// </summary>
    [DataMember(Name = "LateCheckoutPriceCode")]
    public string LateCheckoutCode { get; set; }
    
    /// <summary>
    /// Include airport parking price to extras if true
    /// </summary>
    [DataMember(Name = "AirportParkingPriceEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool AirportParkingPriceEnabled { get; set; }

    /// <summary>
    /// Code for the Airport Parking Price category
    /// </summary>
    [DataMember(Name = "AirportParkingPriceCode")]
    public string AirportParkingPriceCode { get; set; }

    /// <summary>
    /// Text for the Airport Parking Price category
    /// </summary>
    [DataMember(Name = "AirportParkingPriceText")]
    public string AirportParkingPriceText { get; set; }
}