using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Collections
{
    /// <summary>
    /// <see cref="BookingsCollection"/> responsible for building xDB schema of facet model <see cref="BookingsFacet"/>.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public static class BookingsCollection
    {
        public static XdbModel Model { get; } = BuildModel();

        /// <summary>
        /// Build xDB schema of Bookings facet.
        /// </summary>
        /// <returns>xDB schema model.</returns>
        private static XdbModel BuildModel()
        {
            XdbModelBuilder modelBuilder = new XdbModelBuilder("BookingsCollection", new XdbModelVersion(1, 0));

            modelBuilder.DefineFacet<Contact, BookingsFacet>(BookingsFacet.DefaultFacetKey);
            modelBuilder.ReferenceModel(Sitecore.XConnect.Collection.Model.CollectionModel.Model);

            return modelBuilder.BuildModel();
        }
    }
}