using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Idempotent booking service
    /// </summary>
    public interface IIdempotentBookingService
    {
        /// <summary>
        /// Create booking using idempotency key.
        /// If key is not specified booking may be created multiple times, otherwise transaction will be run once for the same key.
        /// </summary>
        /// <param name="request">Booking request</param>
        /// <param name="idempotencyKey">Idempotency key</param>
        /// <returns>Booking model</returns>
        Task<BookingResponse> CreateBooking(BookingRequest request, string idempotencyKey);

        /// <summary>
        /// Idempotent  pay remaining balance for existing booking
        /// </summary>
        /// <param name="request">Request model</param>
        /// <param name="idempotencyKey">Idempotency key</param>
        /// <returns>Booking model</returns>
        Task<BookingResponse> PayRemainingBalance(PayRemainingBalanceRequest request, string idempotencyKey);

        /// <summary>
        /// Process amend booking
        /// </summary>
        /// <param name="request"></param>
        /// <param name="idempotencyKey"></param>
        /// <returns></returns>
        Task<BookingResponse> AmendBooking(AmendBookingRequest request, string idempotencyKey);
    }
}
