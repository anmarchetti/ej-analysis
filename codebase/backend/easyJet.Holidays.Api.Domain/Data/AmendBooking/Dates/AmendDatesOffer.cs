using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;

#pragma warning disable CA2227
/// <summary>
/// Amend dates offer.
/// </summary>
public class AmendDatesOffer
{
    /// <summary>
    /// Selected offer. Combination of transport, transfer,seats and accom.
    /// </summary>
    public Offer Offer { get; set; }

    /// <summary>
    /// Booking ref
    /// </summary>
    public string BookingRef { get; set; }

    /// <summary>
    /// Current booking price.
    /// </summary>
    public decimal BookingPrice { get; set; }

    /// <summary>
    /// Selected offer price.
    /// </summary>
    public decimal OfferPrice { get; set; }

    /// <summary>
    /// Chargers amount for selected offer for different options, e.g. transport, transfer.
    /// </summary>
    public decimal AmendmentFlowCharges { get; set; }

    /// <summary>
    /// Charges amount for updating current booking.
    /// </summary>
    public decimal AmendmentDatesCharges { get; set; }

    /// <summary>
    /// Discount code for selected offer.
    /// </summary>
    public string DiscountCode { get; set; }

    /// <summary>
    /// Booking market code.
    /// </summary>
    public string MarketCode { get; set; }

    /// <summary>
    /// Promocode breakdown
    /// </summary>
    public PromoCodeBreakDown PromoCodeBreakDown { get; set; }

    /// <summary>
    /// Indicates if the offer was from unhappy path
    /// </summary>
    [DataMember(Name = "unhappyPathOffer")]
    public bool UnhappyPathOffer { get; set; }

    /// <summary>
    /// Due Date where remaining balance should be paid
    /// </summary>
    [DataMember(Name = "allowPayBalanceDueDate")]
    public DateTimeOffset AllowPayBalanceDueDate { get; set; }

    /// <summary>
    /// Is seats price changed after validation.
    /// </summary>
    [DataMember(Name = "isSeatsPriceChanged")]
    public bool IsSeatsPriceChanged { get; set; }

    /// <summary>
    /// Is seats price unavailable after validation.
    /// </summary>
    [DataMember(Name = "isSeatsUnavailable")]
    public bool IsSeatsUnavailable { get; set; }

    /// <summary>
    /// Date change amendment info
    /// </summary>
    [DataMember(Name = "seatsChangeEnabled")]
    public bool SeatsChangeEnabled { get; set; }

    /// <summary>
    /// Gets or sets the amendment payment information.
    /// </summary>
    public AmendmentPaymentInfo AmendmentPaymentInfo { get; set; }
    
    /// <summary>
    /// taxes and fees for tourist taxes mapped for manage flow
    /// </summary>
    public List<TaxesAndFees> TaxesAndFees { get; set; }
}

#pragma warning restore CA2227