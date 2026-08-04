using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.XConnect.Common.Facets.ChatBot;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Collections
{
    /// <summary>
    /// <see cref="ChatBotCollection"/> responsible for building xDB schema of facet model <see cref="ChatBotMessagesFacet"/>.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public static class ChatBotCollection
    {
        public static XdbModel Model { get; } = BuildModel();

        /// <summary>
        /// Build xDB schema of ChatBot facets.
        /// </summary>
        /// <returns>xDB schema model.</returns>
        private static XdbModel BuildModel()
        {
            XdbModelBuilder modelBuilder = new XdbModelBuilder("ChatBotCollection", new XdbModelVersion(1, 0));

            modelBuilder.DefineFacet<Contact, ChatBotMessagesFacet>(ChatBotMessagesFacet.DefaultFacetKey);
            modelBuilder.ReferenceModel(Sitecore.XConnect.Collection.Model.CollectionModel.Model);

            return modelBuilder.BuildModel();
        }
    }
}