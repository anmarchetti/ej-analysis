using easyJet.Foundation.Indexing.Schema.Configurations;
using NSubstitute;
using SolrNet.Schema;
using Xunit;

namespace easyJet.Foundation.Indexing.Schema.Tests
{
    public class ConfigurationDrivenPopulateHelperFactoryTests
    {
        private readonly ISolrSchemaConfigurationFactory factory;
        private readonly ConfigurationDrivenPopulateHelperFactory populateHelperFactory;

        public ConfigurationDrivenPopulateHelperFactoryTests()
        {
            factory = Substitute.For<ISolrSchemaConfigurationFactory>();
            populateHelperFactory = new ConfigurationDrivenPopulateHelperFactory(factory, null);
        }

        [Fact(Skip = "Feature needs to be reworked due to changes in Sitecore 10.4")]
        public void GetPopulateHelper_ShouldReturnConfigurationDrivenPopulateHelper()
        {
            // Arrange
            var solrSchema = new SolrSchema();

            // Act
            var result = populateHelperFactory.GetPopulateHelper(solrSchema);

            // Assert
            Assert.NotNull(result);
            Assert.IsType<ConfigurationDrivenPopulateHelper>(result);
        }
    }
}