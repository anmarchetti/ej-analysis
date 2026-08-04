using easyJet.Holidays.Api.Domain.Data.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
#pragma warning disable CA2227
/// <summary>
/// Combination of room and board type.
/// </summary>
public class AmendRoomVariant
{
    /// <summary>
    /// Room composition.
    /// </summary>
    public List<Unit> Units { get; set; }

    /// <summary>
    /// Room type
    /// </summary>
    public string RoomType { get; set; }

    /// <summary>
    /// Board type
    /// </summary>
    public string BoardType { get; set; }

    /// <summary>
    /// Booking price
    /// </summary>
    public decimal BookingPrice { get; set; }

    /// <summary>
    /// Offer price
    /// </summary>
    public decimal OfferPrice { get; set; }

    /// <summary>
    /// Offer price pp
    /// </summary>
    public decimal OfferPricePp { get; set; }

    /// <summary>
    /// Seats price.
    /// Should calculate separately because seats
    /// price doesn't include in promo code calculations.
    /// </summary>
    public decimal SeatsPrice { get; set; }

    /// <summary>
    /// Amendment cost to update booking.
    /// </summary>
    public decimal AmendmentCharges { get; set; }

    /// <summary>
    /// Amendment cost to change room variant.
    /// </summary>
    public decimal FullAmendmentCharges { get; set; }

    /// <summary>
    /// Promocode breakdown
    /// </summary>
    public PromoCodeBreakDown PromoCodeBreakDown { get; set; }

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