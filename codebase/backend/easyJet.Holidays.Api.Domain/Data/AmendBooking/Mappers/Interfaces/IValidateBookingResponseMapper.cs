using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;

/// <summary>
/// Validate booking response mapper.
/// </summary>
public interface IValidateBookingResponseMapper
{
    /// <summary>
    /// Create AmendDatesOffer from atcom ValidateAmendBookingResponse.
    /// </summary>
    /// <param name="validateAmendBookingResponse">Validate amend booking response.</param>
    /// <param name="bookingResponse">Current booking.</param>
    /// <param name="requestOffer">Current state of change date flow.</param>
    /// <returns>New amend dates offer.</returns>
    Task<AmendDatesOffer> MapToAmendDatesOffer(ValidateAmendBookingResponse validateAmendBookingResponse, BookingResponse bookingResponse,
        AmendDatesOffer requestOffer = null);

    /// <summary>
    /// Create AmendRoomVariant from atcom ValidateAmendBookingResponse.
    /// </summary>
    /// <param name="validatedResponse">Validate amend booking response.</param>
    /// <param name="originalBooking">Current booking.</param>
    /// <param name="request">Selected room variant</param>
    /// <returns>Validate room variant with live price.</returns>
    AmendRoomVariant MapToRoomVariant(ValidateAmendBookingResponse validatedResponse, BookingResponse originalBooking, AmendRoomValidationRequest request);

    /// <summary>
    /// Create Offer from atcom ValidateAmendBookingResponse
    /// </summary>
    /// <param name="validateAmendBookingResponse">Validate amend booking response.</param>
    /// <returns>Offer</returns>
    Task<Offer> MapToOffer(ValidateAmendBookingResponse validateAmendBookingResponse);

    /// <summary>
    /// Create amend transfer item.
    /// </summary>
    /// <param name="bookingResponse">Original booking response.</param>
    /// <param name="item">Transfer item from Atcom.</param>
    /// <param name="amendBookingInfo">Info booking modify response from Atcom.</param>
    /// <returns>Amend transfer item.</returns>
    AmendTransferItem MapToAmendTransferItem(BookingResponse bookingResponse, TransferItem item, ValidateAmendBookingResponse amendBookingInfo);

    /// <summary>
    /// Create amend hotel offer.
    /// </summary>
    /// <param name="validateAmendBookingResponse">Info booking modify response from Atcom.</param>
    /// <param name="bookingResponse">Original booking response.</param>
    /// <param name="requestAmendHotelOffer"></param>
    /// <returns>Amend hotel offer</returns>
    Task<AmendHotelOffer> MapToAmendmentHotelOffer(ValidateAmendBookingResponse validateAmendBookingResponse,
        BookingResponse bookingResponse, AmendHotelOffer requestAmendHotelOffer);

    /// <summary>
    /// Caclulate prices of booking extras
    /// </summary>
    /// <param name="booking"></param>
    /// <param name="offerPrice"></param>
    /// <returns></returns>
    (decimal SeatsPrice, decimal ExtraLuggagePrice, decimal DiscountAmount, decimal FullOfferPrice) CalculatePrices(BookingResponse booking, decimal offerPrice);
}