using System;

namespace easyJet.Foundation.Tracking.Models.Requests
{
    /// <summary>
    /// Push Notification Booking Request.
    /// </summary>
    public class PushNotificationBookingRequest
    {
        /// <summary>
        /// Gets or sets Accommodation id.
        /// </summary>
        public string AccommodationId { get; set; }

        /// <summary>
        /// Gets or sets Image Url.
        /// </summary>
        public string Image { get; set; }
    }
}