using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Change extra luggage response
/// </summary>
public class AmendLuggageResponse
{
    /// <summary>
    /// Booked luggage
    /// </summary>
    [DataMember(Name = "extraLuggageInfo")]
    public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

    /// <summary>
    /// How much the amendment costs
    /// </summary>
    public decimal? AmendmentCharges { get; set; }

    /// <summary>
    /// Payment Info
    /// </summary>
    public PriceInfo PaymentInfo { get; set; }

    /// <summary>
    /// Price Breakdown by categories for trade agents
    /// </summary>
    public PriceCategory[] TradeAgentPriceBreakdown { get; set; }

    /// <summary>
    /// Price Breakdown by categories
    /// </summary>
    public PriceCategory[] PriceBreakdown { get; set; }
}