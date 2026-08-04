namespace easyJet.Holidays.Api.Domain.Data.BulkToolBooking
{
    /// <summary>
    /// Response after cancellation and refunding booking.
    /// </summary>
    public class BulkToolResponse
    {
        /// <summary>
        /// Message.
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// Booking reference.
        /// </summary>
        public string Reference { get; set; }

        /// <summary>
        /// Correlation Id.
        /// </summary>
        public string CorrelationId { get; set; }

        /// <summary>
        /// Note.
        /// </summary>
        public string Note { get; set; }
    }
}
