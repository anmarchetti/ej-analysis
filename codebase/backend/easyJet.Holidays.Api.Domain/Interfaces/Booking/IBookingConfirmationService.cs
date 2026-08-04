namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking confirmation service
    /// </summary>
    public interface IBookingConfirmationService
    {
        /// <summary>
        /// Get booking confirmation file stream
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <returns>File stream</returns>
        Task<Stream> GetBookingConfirmation(string bookingReference);
    }
}
