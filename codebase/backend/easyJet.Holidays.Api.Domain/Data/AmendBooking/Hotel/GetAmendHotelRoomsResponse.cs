namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;

/// <summary>
/// Response with alternative room and board options.
/// </summary>
public class GetAmendHotelRoomsResponse
{
    /// <summary>
    /// Alternative options.
    /// </summary>
    public IEnumerable<AmendHotelResponse> AmendHotelOffers { get; set; }

    /// <summary>
    /// Upsell amount.
    /// </summary>
    public decimal UpsellAmount { get; set; }
}