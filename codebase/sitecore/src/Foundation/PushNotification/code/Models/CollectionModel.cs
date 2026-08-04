using easyJet.Foundation.PushNotifications.Facets;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.PushNotifications.Models
{
    /// <summary>
    /// <see cref="CollectionModel"/> responsible for building xDB schema of facet model <see cref="PushSubscriptions"/>.
    /// </summary>
    public static class CollectionModel
    {
        public static XdbModel Model { get; } = BuildModel();

        /// <summary>
        /// Build xDB schema of PushNotifications facets.
        /// </summary>
        /// <returns>xDB schema model.</returns>
        private static XdbModel BuildModel()
        {
            XdbModelBuilder modelBuilder = new XdbModelBuilder("easyJet.Foundation.PushNotifications.Model", new XdbModelVersion(1, 0));

            modelBuilder.RegisterType<PushSubscription>(true);
            modelBuilder.DefineFacet<Contact, PushSubscriptions>(PushSubscriptions.DefaultFacetKey);
            modelBuilder.DefineFacet<Contact, TrackingData>(TrackingData.DefaultFacetKey);
            modelBuilder.DefineFacet<Interaction, UserSearches>(UserSearches.DefaultFacetKey);
            modelBuilder.DefineFacet<Contact, PushNotificationBooking>(PushNotificationBooking.DefaultFacetKey);
            return modelBuilder.BuildModel();
        }
    }
}