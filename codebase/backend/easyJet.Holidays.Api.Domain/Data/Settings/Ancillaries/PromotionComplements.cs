using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;

namespace easyJet.Holidays.Api.Domain.Data.Settings.Ancillaries;

/// <summary>
/// Promotion complements, setup complementary ancillaries (baggage only so far).
/// </summary>
[Serializable]
public class PromotionComplements
{
    /// <summary>
    /// Dev comment, description of the complement.
    /// </summary>
    public string Comment { get; set; }

    /// <summary>
    /// Promotion type, e.g. city-break, beach-holiday, etc.
    /// </summary>
    public string PromotionType { get; set; }

    /// <summary>
    /// Promotion codes, e.g. EUCO, DEBO, FRBF, etc.
    /// </summary>
    [JsonProperty("PromotionCodes")]
    [JsonConverter(typeof(StringToArrayConverter<string>))]
    public string[] Codes { get; set; }

    /// <summary>
    /// Promotion Code as complimentary fallback for internal flights.
    /// </summary>
    public string InternalFallbackCode { get; set; }

    /// <summary>
    /// Set of complementary luggage.
    /// </summary>
    [JsonProperty("Children")]
    public ComplimentaryLuggage[] Luggage { get; set; }
}