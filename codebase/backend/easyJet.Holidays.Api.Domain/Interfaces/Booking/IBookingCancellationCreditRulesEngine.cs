using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Settings;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service which handles refund rules for a booking.
    /// </summary>
    public interface IBookingCancellationCreditRulesEngine
    {
        /// <summary>
        /// Find eligible rule for a booking.
        /// </summary>
        /// <param name="bookingResponse"></param>
        /// <returns></returns>
        public Task<List<CreditOnlyRefundRule>> FindEligibleRule(BookingResponse bookingResponse);
    }
}