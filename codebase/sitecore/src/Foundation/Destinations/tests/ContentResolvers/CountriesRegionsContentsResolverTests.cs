using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class CountriesRegionsContentsResolverTests
    {
        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnNull_IfContextItemHasNoDescendants(
            CountriesRegionsContentsResolver resolver,
            IRenderingConfiguration renderingConfiguration,
            ID homeId)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = "//*";

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            using (Db db = new Db { new DbItem("Home", homeId) { new DbItem("Item 1"), new DbItem("Item 2") } })
            using (new SafeContextItemSwitcher(db.GetItem(homeId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                (actual as JObject)["items"].Should().BeNullOrEmpty();
            }
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldReturnCountries_IfContextItemHasNoDescendants(
           CountriesRegionsContentsResolver resolver,
           IRenderingConfiguration renderingConfiguration,
           ID destinationId)
        {
            // Arrange
            resolver.UseContextItem = true;
            resolver.ItemSelectorQuery = "//*";

            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"}}";

            renderingConfiguration.ItemSerializer
                .Serialize(Arg.Any<Item>())
                .Returns(serilizedItem);

            using (Db db = new Db
            {
                new DbItem("Destinations", destinationId)
                {
                    new DatasourceItemDbItem("Country 1") { TemplateID = Constants.TemplateIds.CountryPage },
                    new DatasourceItemDbItem("Country 2") { TemplateID = Constants.TemplateIds.CountryPage },
                }
            })
            using (new SafeContextItemSwitcher(db.GetItem(destinationId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(2);
            }
        }
    }
}
