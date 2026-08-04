using System;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.PushNotifications.Extenstions;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using Sitecore.XConnect;

namespace easyJet.Foundation.Tracking.Services
{
    /// <summary>
    /// Tracking data service contains methods for working with contacts and tracking data facets.
    /// </summary>
    [Service(typeof(ITrackingDataService))]
    public class TrackingDataService : AnalyticsServiceBase, ITrackingDataService
    {
        public TrackingDataService(IContactService contactService, ITrackingLogger logger)
            : base(contactService, logger)
        {
        }

        /// <inheritdoc/>
        public TrackingData Get()
        {
            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetCurrentTrackerContact(client, TrackingData.DefaultFacetKey);
                    return contact?.TrackingDataFacet();
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Cannot get the {nameof(TrackingData)} facet for contact: [{contact?.Id}] due to {ex.Message}", ex, this);
            }

            return null;
        }

        /// <inheritdoc/>
        public void Update(TrackingHotelDataRequest request)
        {
            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetCurrentTrackerContact(client, TrackingData.DefaultFacetKey);
                    if (contact != null)
                    {
                        var trackingData = contact.TrackingDataFacet() ?? new TrackingData();
                        trackingData.AccommodationId = request.AccId;
                        trackingData.Endpoint = request.Url;

                        SetContactFacet(client, contact, trackingData, TrackingData.DefaultFacetKey);
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Cannot update the {nameof(TrackingData)} facet for contact: [{contact?.Id}] due to {ex.Message}", ex, this);
            }
        }

        /// <inheritdoc/>
        public void UpdateBooking(PushNotificationBookingRequest request)
        {
            Contact contact = null;
            try
            {
                using (IXdbContext client = GetClient())
                {
                    contact = GetCurrentTrackerContact(client, PushNotificationBooking.DefaultFacetKey);
                    if (contact != null)
                    {
                        var data = contact.UserBookingFacet() ?? new PushNotificationBooking();
                        data.Image = request.Image;
                        data.AccommodationId = request.AccommodationId;

                        SetContactFacet(client, contact, data, PushNotificationBooking.DefaultFacetKey);
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Cannot update the {nameof(TrackingData)} facet for contact: [{contact?.Id}] due to {ex.Message}", ex, this);
            }
        }
    }
}