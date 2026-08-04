using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service which handles the cancellation and refund of a booking.
    /// </summary>
    public interface IBookingCancellationRefundValidationService
    {
        /// <summary>
        /// Checks if the booking can be refunded.
        /// </summary>
        /// <returns>boolean</returns>
        Task<bool> IsRefundEnabled(BookingResponse bookingResponse, bool isSharedServiceCall, BookingCancellationReason bookingCancellationReason);

        /// <summary>
        /// Checks if the current user is the lead passenger of the booking.
        /// </summary>
        /// <returns>boolean</returns>
        Task<bool> IsCurrentUserLeadPassenger(BookingResponse bookingResponse);
    }
}