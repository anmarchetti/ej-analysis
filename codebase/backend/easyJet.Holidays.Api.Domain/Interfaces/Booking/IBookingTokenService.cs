using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingTokenService
    {
        /// <summary>
        /// Generate encoded token to get booking which has: reference, lastname and date
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        string GetBookingToken(GetBookingRequest request);

        /// <summary>
        /// Parses secure token to get booking by reference/lastname/date
        /// </summary>
        /// <param name="token">Token to parse</param>
        /// <returns></returns>
        GetBookingRequest ParseGetBookingToken(string token);
    }
}