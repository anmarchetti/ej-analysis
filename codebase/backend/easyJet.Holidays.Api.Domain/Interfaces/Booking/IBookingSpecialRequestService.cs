using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking special request service
    /// </summary>
    public interface IBookingSpecialRequestService
    {
        /// <summary>
        /// Add special requests to booking
        /// </summary>
        /// <param name="requestCodes">Codes of special requests</param>
        /// /// <param name="bookingResponse">Booking response</param>
        /// <returns></returns>
        Task<BookingResponse> AddSpecialRequestsToBooking(string requestCodes, BookingResponse bookingResponse, string sessionId, string requestId);

        /// <summary>
        /// Ammend ssr on booking
        /// </summary>
        /// <param name="requestCodes">SSR codes to amend</param>
        /// <param name="bookingResponse">Booking resposne</param>
        /// <returns></returns>
        Task<BookingResponse> AmmendSpecialRequestsFromBooking(IEnumerable<string> requestCodes, BookingResponse bookingResponse);

        /// <summary>
        /// Enshure id amend is allowed for the booking.
        /// </summary>
        /// <param name="booking">booking to update</param>
        /// <param name="shouldThrowError">Need to throw eeror if not allowed to amend ssr</param>
        /// <returns></returns>
        Task<BookingResponse> EnsureAmmendSSr(BookingResponse booking, bool shouldThrowError = false);

        /// <summary>
        /// Find special requests by codes
        /// </summary>
        /// <param name="codes">Codes of special requests</param>
        /// <returns></returns>
        Task<List<SpecialRequest>> GetSpecialRequestsByCodes(IEnumerable<string> codes);

        /// <summary>
        /// Make sure that adding special requests is allowed for the booking.
        /// </summary>
        /// <param name="bookingAccommodation"></param>
        /// <returns></returns>
        Task EnsureCreateSpecialRequests(BookingAccommodation bookingAccommodation);

        /// <summary>
        /// Validates the special request codes.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">At list one special request code is invalid</exception>
        Task ValidateSpecialRequestCodes(IEnumerable<string> codes);

        /// <summary>
        /// Validates the special request contradictionary group.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">Booking has more the one special request in {contradictoryGroup.Name}</exception>
        Task ValidateSpecialRequestContradictionaryGroup(IEnumerable<string> codes);

        /// <summary>
        /// Validate the amendments of the special requests..
        /// </summary>
        /// <param name="booking">The booking.</param>
        /// <returns></returns>
        Task<bool> ValidateSpecialRequestAmendmends(BookingResponse booking);
    }
}
