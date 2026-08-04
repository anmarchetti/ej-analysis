using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.Tracking.Models.Requests;

namespace easyJet.Foundation.Tracking.Services
{
    public interface ITrackingDataService
    {
        /// <summary>
        /// Get tracking data.
        /// </summary>
        /// <returns>Tracking data.</returns>
        TrackingData Get();

        /// <summary>
        /// Update tracking data facet.
        /// </summary>
        /// <param name="request">Tracking data request.</param>
        void Update(TrackingHotelDataRequest request);

        /// <summary>
        /// Update tracking data facet.
        /// </summary>
        /// <param name="request">Push Notification Booking data request.</param>
        void UpdateBooking(PushNotificationBookingRequest request);
    }
}
