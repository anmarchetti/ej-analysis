using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Booking paymen transactino model
    /// </summary>
    public class BookingTransaction
    {
        /// <summary>
        /// Id value
        /// </summary>
        public string Id { get; set; }
        /// <summary>
        /// Last updated time mls
        /// </summary>
        public long Timestamp { get; set; }

        /// <summary>
        /// Transaction state. See <see cref="BookingTransactionState"/> for available states
        /// </summary>
        public string State { get; set; }

        /// <summary>
        /// Booking reference. Exists only if trasaction was completed
        /// </summary>
        public string BookingReference { get; set; }

        /// <summary>
        /// Failed transaction error message
        /// </summary>
        public string Exception { get; set; }

        /// <summary>
        /// Inner errors for failed transaction
        /// </summary>
        public ApiError[] InnerErrors { get; set; }

        /// <summary>
        /// Faile dtransaction correlation id
        /// </summary>
        public string CorrelationId { get; set; }

        /// <summary>
        /// Conert strng value to status enum
        /// </summary>
        /// <returns>Status enum</returns>
        public BookingTransactionState GetState()
        {
            if (Enum.TryParse<BookingTransactionState>(State, out var stateEnum))
            {
                return stateEnum;
            }

            return BookingTransactionState.UNKNOWN;
        }
    }

    /// <summary>
    /// State options
    /// </summary>
    public enum BookingTransactionState
    {
        /// <summary>
        /// Created, not started
        /// </summary>
        NEW,

        /// <summary>
        /// Transaction in progress
        /// </summary>
        IN_PROGRESS,

        /// <summary>
        /// Transaction in progress, but requires payment auth
        /// </summary>
        PAYMENT_AUTH_REQUIRED,

        /// <summary>
        /// Completed
        /// </summary>
        COMPLETED,

        /// <summary>
        /// Failed
        /// </summary>
        FAILED,

        /// <summary>
        /// Unknown status
        /// </summary>
        UNKNOWN
    }
}
