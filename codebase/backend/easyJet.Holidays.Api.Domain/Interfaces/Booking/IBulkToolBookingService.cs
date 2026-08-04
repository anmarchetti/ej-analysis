using easyJet.Holidays.Api.Domain.Data.BulkToolBooking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Service for bulk process bookings.
    /// </summary>
    public interface IBulkToolBookingService
    {
        /// <summary>
        /// Run bulk booking process.
        /// </summary>
        /// <param name="request">Request witch conatins piars booking reference and flag.</param>
        /// <param name="correlationId">Correlation id for http session.</param>
        /// <returns>Bulk tool booking result.</returns>
        Task<BulkToolResponse> RunBulkProcess(BulkToolRequest request, string correlationId);
    }
}
