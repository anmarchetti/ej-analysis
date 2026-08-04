using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

/// <summary>
/// Model which contains additional information for alt flight for current booking
/// </summary>
[Serializable]
[DataContract]
public class AlternativeFlightOffer : Offer
{
    /// <summary>
    /// Transfer price for current booking.
    /// </summary>
    [DataMember(Name = "transferPrice")]
    public decimal TransferPrice { get; set; }

    /// <summary>
    /// Prome code discount for current booking.
    /// </summary>
    [DataMember(Name = "discountAmount")]
    public decimal DiscountAmount { get; set; }

    /// <summary>
    /// Seats price for current booking.
    /// </summary>
    [DataMember(Name = "seatsPrice")]
    public decimal SeatsPrice { get; set; }

    /// <summary>
    /// extra luggage price for current booking.
    /// </summary>
    [DataMember(Name = "extraLuggagePrice")]
    public decimal ExtraLuggagePrice { get; set; }

    /// <summary>
    /// The last price for alternative flight changes.
    /// </summary>
    [DataMember(Name = "totalPrice")]
    public decimal TotalPrice { get; set; }
}