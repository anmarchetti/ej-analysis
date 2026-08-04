using easyJet.Foundation.PushNotifications.Facets;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Extenstions
{
    public static class CollectionModel
    {
        /// <summary>
        /// Get push subscribtions facet from contact.
        /// </summary>
        /// <param name="contact">The contact.</param>
        /// <returns>The push subscriptions facet.</returns>
        public static PushSubscriptions Subscriptions(this Contact contact)
        {
            return contact.GetFacet<PushSubscriptions>(PushSubscriptions.DefaultFacetKey);
        }

        /// <summary>
        /// Get tracking data facet from contact.
        /// </summary>
        /// <param name="contact">The contact.</param>
        /// <returns>The <see cref="TrackingData"/> facet.</returns>
        public static TrackingData TrackingDataFacet(this Contact contact)
        {
            return contact.GetFacet<TrackingData>(TrackingData.DefaultFacetKey);
        }

        /// <summary>
        /// Get user search facet from contact.
        /// </summary>
        /// <param name="interaction">The interaction.</param>
        /// <returns>The <see cref="UserSearch"/> facet.</returns>
        public static UserSearches UserSearchesFacet(this Interaction interaction)
        {
            return interaction.GetFacet<UserSearches>(UserSearches.DefaultFacetKey);
        }

        /// <summary>
        /// Gets or Sets PushNotification Booking Facet
        /// </summary>
        /// <param name="contact">The contact.</param>
        /// <returns>The <see cref="PushNotificationBooking"/> facet.</returns>
        public static PushNotificationBooking UserBookingFacet(this Contact contact)
        {
            return contact.GetFacet<PushNotificationBooking>(PushNotificationBooking.DefaultFacetKey);
        }
    }
}