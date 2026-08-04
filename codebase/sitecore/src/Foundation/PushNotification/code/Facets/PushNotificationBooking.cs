using System;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Push Notification Booking Data Facet
    /// </summary>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class PushNotificationBooking : Facet
    {
        public const string DefaultFacetKey = "PushNotificationBooking";

        /// <summary>
        /// Gets or sets Accommodation Id.
        /// </summary>
        public string AccommodationId { get; set; }

        /// <summary>
        /// Gets or sets Image Url.
        /// </summary>
        public string Image { get; set; }
    }
}