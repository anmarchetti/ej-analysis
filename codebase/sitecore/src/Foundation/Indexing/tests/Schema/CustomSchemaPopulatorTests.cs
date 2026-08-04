using easyJet.Foundation.Indexing.Schema;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Caching;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.SolrProvider.Abstractions;
using Sitecore.ContentSearch.SolrProvider.Pipelines.PopulateSolrSchema;
using Xunit;

namespace easyJet.Foundation.Indexing.Tests.Schema
{
    public class CustomSchemaPopulatorTests
    {
        private readonly IPopulateHelperFactory populateHelperFactory;
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private readonly CustomSchemaPopulator customSchemaPopulator;

        public CustomSchemaPopulatorTests()
        {
            populateHelperFactory = Substitute.For<IPopulateHelperFactory>();
            sitecoreContextProvider = Substitute.For<ISitecoreContextProvider>();
            sitecoreContextProvider.Items.Returns(new ItemsContext());
            customSchemaPopulator = Substitute.ForPartsOf<CustomSchemaPopulator>(populateHelperFactory, sitecoreContextProvider);
        }

        [Fact(Skip = "Feature needs to be reworked due to changes in Sitecore 10.4")]
        public void Process_ShouldSetIndexNameInSitecoreContextProvider()
        {
            // Arrange
            var index = Substitute.For<ISearchIndex>();
            index.Name.Returns("test_index");
#pragma warning disable CS0618 // PopulateManagedSchemaArgs(ISearchIndex) is obsolete in current Sitecore package.
            var args = new PopulateManagedSchemaArgs(index);
#pragma warning restore CS0618

            // Act
            customSchemaPopulator.SetIndexName(args);

            // Assert
            sitecoreContextProvider.Items[Constants.SchemaIndexNameKey].Should().Be("test_index");
        }
    }
}