using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    public interface IBookingSessionService
    {
        /// <summary>
        /// Persists a new BookingSession
        /// </summary>
        /// <param name="bookingSession">the BookingSession to persist</param>
        /// <returns></returns>
        Task CreateBookingSession(BookingSession bookingSession);

        /// <summary>
        /// Retrieves a BookingSession by its BookingReferences
        /// </summary>
        /// <param name="bookingRef">the BookingReferences to use as a key for retrieval</param>
        /// <returns>the BookingSession with <paramref name="bookingRef"/> as its BookingRef property.</returns>
        Task<BookingSession> GetBookingSession(string bookingRef);
    }
}
