using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.XConnect.Common.Facets.Email;
using Sitecore.XConnect;
using Sitecore.XConnect.Schema;

namespace easyJet.Foundation.XConnect.Common.Collections
{
    /// <summary>
    /// <see cref="EmailCollection"/> responsible for building xDB schema of facet model <see cref="EmailsListFacet"/>.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class EmailCollection
    {
        public static XdbModel Model { get; } = BuildModel();

        /// <summary>
        /// Build xDB schema of EmailsList facet.
        /// </summary>
        /// <returns>xDB schema model.</returns>
        private static XdbModel BuildModel()
        {
            XdbModelBuilder modelBuilder = new XdbModelBuilder("EmailCollection", new XdbModelVersion(1, 0));

            modelBuilder.DefineFacet<Contact, EmailsListFacet>(EmailsListFacet.DefaultFacetKey);
            modelBuilder.ReferenceModel(Sitecore.XConnect.Collection.Model.CollectionModel.Model);

            return modelBuilder.BuildModel();
        }
    }
}