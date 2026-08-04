using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Post booking service
    /// </summary>
    public interface IBookingChangeService
    {
        /// <summary>
        /// Amend special requests on a booking
        /// </summary>
        /// <param name="request">Amend booking ssr request</param>
        /// <returns></returns>
        Task<BookingResponse> AmendSpecialRequests(AmendSsrRequest request);

        /// <summary>
        /// Check if booking has memo "PRVC". If have not - added. If exist - change by private attribute
        /// </summary>
        /// <param name="booking">Booking response</param>
        /// <param name="isPrivate">Private attribute</param>
        /// <returns></returns>
        Task<List<Memo>> ChangeBookingPrivacy(BookingResponse booking, bool isPrivate);
    }
}