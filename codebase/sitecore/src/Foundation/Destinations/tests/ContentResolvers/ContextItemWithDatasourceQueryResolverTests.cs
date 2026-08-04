using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using Newtonsoft.Json.Linq;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class ContextItemWithDatasourceQueryResolverTests
    {
        private readonly ContextItemWithDatasourceQueryResolver resolver;
        private readonly IRenderingConfiguration renderingConfig;

        public ContextItemWithDatasourceQueryResolverTests()
        {
            resolver = new ContextItemWithDatasourceQueryResolver { UseContextItem = true };
            renderingConfig = Substitute.For<IRenderingConfiguration>();
            renderingConfig.ItemSerializer.Serialize(Arg.Any<Item>()).Returns("{}");
        }

        [Fact]
        public void ResolveContents_ShouldReturnNull_IfContextItemIsNull()
        {
            // Arrange
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnItemsFromQuery_WhenTemplateIsNotVirtual(Db db, ID contextId)
        {
            // Arrange
            resolver.ItemSelectorQuery = "./*";

            db.Add(new DbItem("Context", contextId)
            {
                new DbItem("Child 1"),
                new DbItem("Child 2"),
            });

            using (new SafeContextItemSwitcher(db.GetItem(contextId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(2);
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnEmptyItems_WhenNoQueryAndNotVirtual(Db db, ID contextId)
        {
            // Arrange
            resolver.ItemSelectorQuery = null;

            db.Add(new DbItem("Context", contextId) { new DbItem("Child 1") });

            using (new SafeContextItemSwitcher(db.GetItem(contextId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().NotBeNull();
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnRelatedRegions_WhenContextIsVirtualRegion(
            Db db, ID contextId, ID regionId1, ID regionId2)
        {
            // Arrange
            db.Add(new DbItem("VirtualRegion", contextId, Constants.TemplateIds.VirtualRegion)
            {
                { Constants.Fields.VirtualDestination.Regions, $"{regionId1}|{regionId2}" }
            });
            db.Add(new DbItem("Region 1", regionId1));
            db.Add(new DbItem("Region 2", regionId2));

            using (new SafeContextItemSwitcher(db.GetItem(contextId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(2);
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnRelatedResorts_WhenContextIsVirtualResort(
            Db db, ID contextId, ID resortId1, ID resortId2)
        {
            // Arrange
            db.Add(new DbItem("VirtualResort", contextId, Constants.TemplateIds.VirtualResort)
            {
                { Constants.Fields.VirtualDestination.Resorts, $"{resortId1}|{resortId2}" }
            });
            db.Add(new DbItem("Resort 1", resortId1));
            db.Add(new DbItem("Resort 2", resortId2));

            using (new SafeContextItemSwitcher(db.GetItem(contextId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(2);
            }
        }

        [Theory]
        [AutoData]
        public void ResolveContents_ShouldReturnEmptyItems_WhenVirtualRegionHasNoRelatedItems(Db db, ID contextId)
        {
            // Arrange
            db.Add(new DbItem("VirtualRegion", contextId, Constants.TemplateIds.VirtualRegion)
            {
                { Constants.Fields.VirtualDestination.Regions, string.Empty }
            });

            using (new SafeContextItemSwitcher(db.GetItem(contextId)))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfig);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(0);
            }
        }
    }
}