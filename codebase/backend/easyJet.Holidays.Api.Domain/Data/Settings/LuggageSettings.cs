using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Settings;

/// <summary>
/// Sitecore settings for luggage.
/// </summary>
[Serializable]
[DataContract]
public class LuggageSettings
{
    /// <summary>
    /// Indicates if hold luggage is enable on booking flow.
    /// </summary>
    [DataMember(Name = "IsHoldLuggageEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool EnableHoldLuggageBookingFlow { get; set; }

    /// <summary>
    /// Indicates if sport equipment is enable on booking flow.
    /// </summary>
    [DataMember(Name = "IsSportsEquipmentEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool EnableSportsEquipmentBookingFlow { get; set; }

    /// <summary>
    /// Indicates if cabin bags is enable on booking flow.
    /// </summary>
    [DataMember(Name = "IsCabinBagsEnabled")]
    [JsonConverter(typeof(SiteCoreBooleanConverter))]
    public bool EnableCabinBagsBookingFlow { get; set; }

    /// <summary>
    /// Default free bags configuration, luggage codes and quantity.
    /// </summary>
    [DataMember(Name = "DefaultFreeBagsPerNonInfantPassenger")]
    [JsonConverter(typeof(SiteCoreNameValueListConverter<int>))]
    public Dictionary<string, int> DefaultFreeBagsPerNonInfantPassenger { get; set; }

    /// <summary>
    /// Limit of extra hold bags added per passenger.
    /// </summary>
    [DataMember(Name = "HoldLuggageMaximalAdditionalBagsPerNonInfantPassenger")]
    public int HoldLuggageMaxPerPassenger { get; set; }

    /// <summary>
    /// Hold luggage category codes for limiting extra hold bags added per passenger.
    /// </summary>
    [DataMember(Name = "HoldLuggageMaximalAdditionalBagsPerNonInfantPassengerCategoryCodes")]
    public string HoldLuggageCategoryCodes { get; set; }

    /// <summary>
    /// Maximal number of sports equipment capped per passenger.
    /// </summary>
    [DataMember(Name = "SportsEquipmentMaximalItemPerNonInfantPassenger")]
    public int SportsEquipmentMaxPerPassenger { get; set; }

    /// <summary>
    /// Sport equipment category codes for limitation maximal sport equipments items capped per passenger.
    /// </summary>
    [DataMember(Name = "SportsEquipmentMaximalItemPerNonInfantPassengerCategoryCodes")]
    public string SportsEquipmentCategoryCodes { get; set; }

    /// <summary>
    /// Maximal number of large sport equipments capped per booking.
    /// </summary>
    [DataMember(Name = "SportsEquipmentMaximalLargeItemsPerNonInfantPassengerPerBooking")]
    public int SportsEquipmentLargeMaxPerBooking { get; set; }

    /// <summary>
    /// Large sport equipment category codes for limitation maximal large sport equipments items capped per booking.
    /// </summary>
    [DataMember(Name = "SportsEquipmentMaximalLargeItemsPerNonInfantPassengerPerBookingCategoryCodes")]
    public string SportsEquipmentLargeCategoryCodes { get; set; }

    /// <summary>
    /// Large Cabin Bag code (Atcom).
    /// </summary>
    [DataMember(Name = "LargeCabinBagCode")]
    public string LargeCabinBagCode { get; set; }

    /// <summary>
    /// Large Cabin Bag category code (Atcom).
    /// </summary>
    [DataMember(Name = "LargeCabinBagCategoryCode")]
    public string LargeCabinBagCategoryCode { get; set; }

    /// <summary>
    /// Large Cabin Bag for limitation maximal bags for each passenger.
    /// </summary>
    [DataMember(Name = "LargeCabinBagMaxPerPassenger")]
    public int LargeCabinBagMaxPerPassenger { get; set; }
}