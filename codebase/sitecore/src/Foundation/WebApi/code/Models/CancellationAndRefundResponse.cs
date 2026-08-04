namespace easyJet.Foundation.WebApi.Models
{
    /// <summary>
    /// Booking cancellation and refund request model.
    /// </summary>
    public class CancellationAndRefundResponse
    {
        public string Message { get; set; }

        public string Reference { get; set; }

        public string CorrelationId { get; set; }

        public string Note { get; set; }
    }
}