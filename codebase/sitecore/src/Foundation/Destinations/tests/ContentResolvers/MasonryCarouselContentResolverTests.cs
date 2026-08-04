using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Services;
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
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class MasonryCarouselContentResolverTests
    {
        private readonly IRenderingConfiguration renderingConfiguration;
        private readonly IOrderedListItemsManager orderedListItemsManager;
        private readonly MasonryCarouselContentResolver resolver;

        public MasonryCarouselContentResolverTests()
        {
            renderingConfiguration = Substitute.For<IRenderingConfiguration>();
            orderedListItemsManager = Substitute.For<IOrderedListItemsManager>();
            resolver = new MasonryCarouselContentResolver(orderedListItemsManager);
        }

        [Fact]
        public void ResolveContents_ShouldReturnNull_IfContextItemIsNull()
        {
            // Arrange
            resolver.UseContextItem = true;

            using (new SafeContextItemSwitcher(null))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeEmpty_IfGetMasonaryItemsReturnEmptyList()
        {
            // Arrange
            resolver.UseContextItem = true;
            List<Item> nullList = null;
            orderedListItemsManager.GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(nullList);

            var item = new FakeItem().WithItemVersions().WithTemplate(Constants.TemplateIds.Country);
            item.ToSitecoreItem().Versions.Count.Returns(1);
            using (new SafeContextItemSwitcher(item))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(0);
            }
        }

        [Fact]
        public void ResolveContents_ShouldResolveContent_IfGetMasonaryItemsReturnItems()
        {
            // Arrange
            resolver.UseContextItem = true;

            FakeItem fieldItem = new FakeItem().WithItemVersions().WithTemplate(Constants.TemplateIds.Country);
            fieldItem.ToSitecoreItem().Versions.Count.Returns(1);

            List<Item> fieldItems = new List<Item>() { fieldItem };
            orderedListItemsManager.GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(fieldItems);

            var contextItem = new FakeItem().WithItemVersions().WithTemplate(Constants.TemplateIds.Country);
            contextItem.ToSitecoreItem().Versions.Count.Returns(1);
            string serilizedItem = "{\"PageCategory\":{\"value\":\"Global\"}}";
            renderingConfiguration.ItemSerializer.Serialize(Arg.Any<Item>()).Returns(serilizedItem);
            using (new SafeContextItemSwitcher(contextItem))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(1);
            }
        }

        [Fact]
        public void ResolveContents_ShouldResolveVirtualResortItems_FromResortsField()
        {
            // Arrange
            resolver.UseContextItem = true;

            using (var db = new Db())
            {
                var resortOne = new DbItem("Resort One");
                resortOne.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());
                var resortTwo = new DbItem("Resort Two");
                resortTwo.Fields.Add(FieldIDs.LayoutField, ID.NewID.ToString());

                var virtualResort = new DbItem("Virtual Resort", ID.NewID, Constants.TemplateIds.VirtualResort);
                virtualResort.Fields.Add(Constants.Fields.VirtualDestination.Resorts, $"{resortOne.ID}|{resortTwo.ID}");

                db.Add(resortOne);
                db.Add(resortTwo);
                db.Add(virtualResort);

                renderingConfiguration.ItemSerializer.Serialize(Arg.Any<Item>()).Returns("{\"PageCategory\":{\"value\":\"Global\"}}");

                using (new SafeContextItemSwitcher(db.GetItem(virtualResort.ID)))
                {
                    // Act
                    var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                    // Assert
                    actual.Should().BeOfType<JObject>();
                    ((actual as JObject)["items"] as JArray).Count.Should().Be(2);
                    orderedListItemsManager.DidNotReceive().GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>());
                }
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeEmpty_ForUnknownTemplate()
        {
            // Arrange
            resolver.UseContextItem = true;
            var unknownTemplateItem = new FakeItem().WithItemVersions().WithTemplate(ID.NewID);
            unknownTemplateItem.ToSitecoreItem().Versions.Count.Returns(1);

            using (new SafeContextItemSwitcher(unknownTemplateItem))
            {
                // Act
                var actual = resolver.ResolveContents(new Rendering(), renderingConfiguration);

                // Assert
                actual.Should().BeOfType<JObject>();
                ((actual as JObject)["items"] as JArray).Count.Should().Be(0);
                orderedListItemsManager.DidNotReceive().GetOrderedItems(Arg.Any<Item>(), Arg.Any<string>());
            }
        }
    }
}