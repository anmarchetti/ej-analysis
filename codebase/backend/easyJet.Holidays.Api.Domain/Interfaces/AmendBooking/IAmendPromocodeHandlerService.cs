using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Promotion;

namespace easyJet.Holidays.Api.Domain.Interfaces.AmendBooking
{
    /// <summary>
    /// Service to handle promocode error logic
    /// </summary>
    public interface IAmendPromocodeHandlerService
    {
        /// <summary>
        /// Logic to handle next request if the first one had an error from atcom with promocode
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <param name="originalBooking"></param>
        /// <param name="validatedOfferResponse"></param>
        /// <returns></returns>
        Task<ValidateAmendBookingResponse> HandlePromocode(BookingResponse bookingResponse, BookingResponse originalBooking, ValidateAmendBookingResponse validatedOfferResponse);
        Task<CmsPromocode> GetAtcomPromocode(BookingResponse originalBooking, ValidateAmendBookingResponse validatedOfferResponse);
    }
}
