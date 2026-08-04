namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    public class CanBeRefunded
    {
        /// <summary>
        /// Whether cancel & refund enabled by the rules
        /// </summary>
        public bool IsEnabled { get; set; }

        /// <summary>
        /// Available refund type
        /// </summary>
        public RefundType Type { get; set; } = RefundType.CreditAndRefund;
    }

    /// <summary>
    /// Refund types
    /// </summary>
    public enum RefundType
    {
        /// <summary>
        /// Credit only
        /// </summary>
        CreditOnly,
        /// <summary>
        /// Credit or refund
        /// </summary>
        CreditAndRefund
    }
}
