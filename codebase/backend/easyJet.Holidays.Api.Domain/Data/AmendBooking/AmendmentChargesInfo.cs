using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Amendment charges info
/// </summary>
[Serializable]
[DataContract]
public class AmendmentChargesInfo
{
    /// <summary>
    /// Original booking price
    /// </summary>
    [DataMember(Name = "bookingPrice")]
    public decimal BookingPrice { get; set; }

    /// <summary>
    /// offer price from atcom cache
    /// </summary>
    [DataMember(Name = "offerPrice")]
    public decimal OfferPrice { get; set; }

    /// <summary>
    /// Offer price include extras price
    /// </summary>
    [DataMember(Name = "fullOfferPrice")]
    public decimal FullOfferPrice { get; set; }

    /// <summary>
    /// Booking seats price
    /// </summary>
    [DataMember(Name = "seatsPrice")]
    public decimal SeatsPrice { get; set; }

    /// <summary>
    /// Booking extra luggage price
    /// </summary>
    [DataMember(Name = "extraLuggagePrice")]
    public decimal ExtraLuggagePrice { get; set; }

    /// <summary>
    /// Amendment charges between current selected offer and previous selected offer
    /// </summary>
    [DataMember(Name = "amendmentCharges")]
    public decimal AmendmentCharges { get; set; }

    /// <summary>
    /// Amendment charges between original booking and selected offers
    /// </summary>
    [DataMember(Name = "fullAmendmentCharges")]
    public decimal FullAmendmentCharges { get; set; }
    
    /// <summary>
    /// Promocode breakdown
    /// </summary>
    [DataMember(Name = "promoCodeBreakDown")]
    public PromoCodeBreakDown PromoCodeBreakDown { get; set; }
    
    /// <summary>
    /// Discount code for selected offer.
    /// </summary>
    [DataMember(Name = "discountCode")]
    public string DiscountCode { get; set; }
}