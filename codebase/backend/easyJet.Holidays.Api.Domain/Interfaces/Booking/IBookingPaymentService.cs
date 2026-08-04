using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking payment service
    /// </summary>
    public interface IBookingPaymentService
    {
        /// <summary>
        /// Process payment
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <param name="validateResponse"></param>
        /// <param name="commitBooking"></param>
        /// <returns></returns>
        Task<BookingResponse> ProcessPayment(BookingRequest bookingRequest,
            ValidateBookingResponse validateResponse,
            Func<Task<BookingResponse>> commitBooking);
    }
}