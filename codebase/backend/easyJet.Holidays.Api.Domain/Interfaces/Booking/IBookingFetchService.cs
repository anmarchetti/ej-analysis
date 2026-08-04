using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingFetchService
    {
        /// <summary>
        /// Obtain booking details by booking reference, last name and departure date
        /// </summary>
        /// <param name="request">Booking request: reference, lastname and departure date</param>
        /// <returns>Stateful booking response</returns>
        Task<BookingResponse> Get(GetBookingRequest request);

        /// <summary>
        /// Obtain booking status by booking reference, last name and departure date ignoring the 'Private' flag on the booking
        /// </summary>
        /// <param name="request">Booking request: reference, lastname and departure date</param>
        /// <returns>booking status</returns>
        Task<string> GetBookingStatus(GetBookingRequest request);

        /// <summary>
        /// Obtain booking details by token: encoded booking reference, last name and departure date
        /// </summary>
        /// <param name="token">Booking request: reference, lastname and departure date</param>
        /// <returns>Stateful booking response</returns>
        Task<BookingResponse> Get(string token);

        /// <summary>
        /// - Removes payment details if user is not logged in
        /// - Enriches hotel/airports information from CMS
        /// - Checks if fraud was detected
        /// </summary>
        /// <param name="booking">Booking to process</param>
        Task EnrichAndSecureBookingResponse(BookingResponse booking);

        /// <summary>
        /// Check whether booking can be changed:
        /// - in valid status(BOOKING)
        /// - full paid
        /// - before configured date (can be turned on/off based on settings)
        /// - not changed before (configurable)
        /// </summary>
        /// <param name="booking"></param>
        /// <returns></returns>
        [Obsolete("replaced with credit functionality")]
        Task<bool> BookingCanBeChanged(BookingResponse booking);

        /// <summary>
        /// Check if booking has memo "PRVC" which means that booking has privacy attribute
        /// </summary>
        /// <param name="memo">Booking memo props</param>
        /// <returns></returns>
        bool BookingIsPrivate(List<Memo> memo);

        /// <summary>
        /// Validate current user by booking privacy
        /// </summary>
        /// <param name="booking">Booking response</param>
        /// <returns></returns>
        Task ValidateByBookingPrivacy(BookingResponse booking);
    }
}