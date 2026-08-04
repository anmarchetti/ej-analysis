namespace easyJet.Holidays.Api.Domain.Data.BulkToolBooking
{
    /// <summary>
    /// Cancellation and refund model.
    /// </summary>
    public class Booking
    {
        /// <summary>
        /// Booking refrence.
        /// </summary>
        public string Reference { get; set; }

        /// <summary>
        /// Customer email address.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Cancellation and refund tool action. Flag should be: cancel, cancel and refund, refund.
        /// </summary>
        public string Flag { get; set; }

        /// <summary>
        /// Booking Memo Code.
        /// </summary>
        public string MemoCode { get; set; }

        /// <summary>
        /// Booking Memo Description.
        /// </summary>
        public string MemoDescription { get; set; }

        /// <summary>
        /// Amount of credit.
        /// </summary>
        public string Amount { get; set; }

        /// <summary>
        /// Credit reason.
        /// </summary>
        public string Reason { get; set; }

        /// <summary>
        /// Credit source.
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Credit memo.
        /// </summary>
        public string Memo { get; set; }

        /// <summary>
        /// Currency.
        /// </summary>
        public string Currency { get; set; }
    }
}
