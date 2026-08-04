using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// Booking service
    /// </summary>
    public interface IBookingTransactionsService
    {
        /// <summary>
        /// Create new transaction with NEW state (not active)
        /// </summary>
        /// <returns>Trnsaction</returns>
        Task<BookingTransaction> Create(string id);

        /// <summary>
        /// Get transaction details by id. Returns null if transaction doesn't exist
        /// </summary>
        /// <param name="transactionId">Transaction id</param>
        /// <returns>Transactin details or null</returns>
        Task<BookingTransaction> Get(string idtransactionId);

        Task Start(string idempotencyKey);
        Task Complete(string idempotencyKey, string bookingReference);
        Task PaymentAuthRequired(string idempotencyKey);
        Task Fail(string idempotencyKey, Exception ex, string traceIdentifier);
    }
}
