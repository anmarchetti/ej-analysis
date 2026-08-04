namespace easyJet.Holidays.Api.Domain.Data.FlightPriceStore;

/// <summary>
/// Known fare types
/// </summary>
public enum FareType
{
    /// <summary>
    /// default
    /// </summary>
    Unknown,
    /// <summary>
    /// standard fare, no promotions/discounts
    /// </summary>
    Standard,
    /// <summary>
    /// promotional offer
    /// </summary>
    Promotion,
    /// <summary>
    /// fare with discount provided from airlines to holidays
    /// </summary>
    HolidaysDiscounted
}