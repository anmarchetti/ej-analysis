namespace easyJet.Foundation.Tracking.Models.Requests
{
    /// <summary>
    /// Represents tracking hotel data request model.
    /// </summary>
    public class TrackingHotelDataRequest
    {
        /// <summary>
        /// Gets or Sets Tracking Accommadation code.
        /// </summary>
        public string AccId { get; set; }

        /// <summary>
        /// Gets or Sets Tracking Url.
        /// </summary>
        public string Url { get; set; }
    }
}