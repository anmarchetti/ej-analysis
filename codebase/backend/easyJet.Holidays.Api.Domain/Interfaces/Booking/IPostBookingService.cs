using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Post booking service
    /// </summary>
    public interface IPostBookingService
    {
        /// <summary>
        /// Obtain booking confirmation by booking reference, last name and departure date
        /// </summary>
        /// <param name="request">Booking request: reference, lastname and departure date</param>
        /// <returns>file stream</returns>
        Task<Stream> Confirmation(GetBookingRequest request);

        /// <summary>
        /// Obtain VAT invoice / payment receipt PDF by booking reference, last name and departure date.
        /// </summary>
        /// <param name="request">Booking request: reference, lastname and departure date</param>
        /// <returns>PDF file stream</returns>
        Task<Stream> PaymentReceipt(GetBookingRequest request);

        /// <summary>
        /// Associate booking with current logged in customer.        
        /// </summary>
        /// <param name="request">Booki g details</param>
        /// <returns></returns>
        Task Assign(AssignBookingRequest request);

        /// <summary>
        /// Get collection fo bookings for logged in user.
        /// Throws error if user is not authorized
        /// </summary>
        /// <returns>Collection of booking</returns>
        Task<IEnumerable<BookingResponse>> MyBookings();
    }
}