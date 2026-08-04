using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.XConnect.Common.Facets.CommunicationPreferences;
using easyJet.Foundation.XConnect.Common.Facets.MarketingPreferences;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Collections
{
    /// <summary>
    /// <see cref="ContactCollection"/> responsible for building xDB schema of generic contact facets.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public static class ContactCollection
    {
        public static XdbModel Model { get; } = BuildModel();

        /// <summary>
        /// Build xDB schema of contact data related facets.
        /// </summary>
        /// <returns>xDB schema model.</returns>
        private static XdbModel BuildModel()
        {
            XdbModelBuilder modelBuilder = new XdbModelBuilder("ContactCollection", new XdbModelVersion(1, 0));

            modelBuilder.DefineFacet<Contact, MarketingPreferencesFacet>(MarketingPreferencesFacet.DefaultFacetKey);
            modelBuilder.DefineFacet<Contact, CommunicationPreferencesFacet>(CommunicationPreferencesFacet.DefaultFacetKey);

            return modelBuilder.BuildModel();
        }
    }
}