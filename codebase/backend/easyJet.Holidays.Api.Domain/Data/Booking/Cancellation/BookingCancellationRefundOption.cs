namespace easyJet.Holidays.Api.Domain.Data.Booking.Cancellation
{
    /// <summary>
    /// The option to refund
    /// </summary>
    public enum BookingCancellationRefundOption
    {
        /// <summary>
        /// No refund
        /// </summary>
        None,

        /// <summary>
        /// Refund only credit
        /// </summary>
        CreditOnly,

        /// <summary>
        /// Refund only credit
        /// </summary>
        OriginalPayment,

        /// <summary>
        /// Refund credit and cash
        /// </summary>
        CreditAndOriginalPayment
    }
}