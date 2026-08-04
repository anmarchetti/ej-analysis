using easyJet.Foundation.SitecoreExtensions.Utils;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Utils
{
    public class ItemUtilsTests
    {
        [Fact]
        public void GetTrackingId_ShouldReturnNull_IfItemIsNull()
        {
            // Act
            var trackingId = ItemUtils.GetTrackingId(null);

            // Assert
            trackingId.Should().BeNull();
        }

        [Fact]
        public void GetTrackingId_ShouldReturnItemName_IfLanguageNameIsEmpty()
        {
            // Arrange
            var item = new FakeItem().WithName("current-name").ToSitecoreItem();

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, string.Empty);

            // Assert
            trackingId.Should().Be("current-name");
        }

        [Fact]
        public void GetTrackingId_ShouldReturnItemName_WhenLanguageNameIsNotParseable()
        {
            // Arrange — an unparseable language must not query for another version
            var item = new FakeItem().WithName("current-name").ToSitecoreItem();

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, "not a language");

            // Assert
            trackingId.Should().Be("current-name");
            item.Database.DidNotReceive().GetItem(item.ID, Arg.Any<Language>());
        }

        [Fact]
        public void GetTrackingId_ShouldReturnNameFieldFromRequestedLanguage_IfLanguageVersionExists()
        {
            // Arrange — cross-language path reads the Name field, not Item.Name
            var item = new FakeItem().WithName("en-item-name").ToSitecoreItem();
            item.Language.Returns(Language.Parse("en"));
            var itemInFr = new FakeItem()
                .WithName("fr-item-name")
                .WithField("Name", "fr-name-field")
                .ToSitecoreItem();

            item.Database.GetItem(
                item.ID,
                Arg.Is<Language>(language => language.Name == "fr"))
                .Returns(itemInFr);

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, "fr");

            // Assert
            trackingId.Should().Be("fr-name-field");
        }

        [Fact]
        public void GetTrackingId_ShouldReturnLanguageVersionItemName_WhenRequestedLanguageVersionHasNoNameFieldValue()
        {
            // Arrange — language version exists but Name field is empty; fall back to that version's Item.Name
            var item = new FakeItem().WithName("en-item-name").ToSitecoreItem();
            item.Language.Returns(Language.Parse("en"));
            var itemInFr = new FakeItem().WithName("fr-item-name").ToSitecoreItem();

            item.Database.GetItem(
                item.ID,
                Arg.Is<Language>(language => language.Name == "fr"))
                .Returns(itemInFr);

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, "fr");

            // Assert
            trackingId.Should().Be("fr-item-name");
        }

        [Fact]
        public void GetTrackingId_ShouldReturnItemName_WhenRequestedLanguageVersionDoesNotExist()
        {
            // Arrange
            var item = new FakeItem().WithName("fallback-name").ToSitecoreItem();
            item.Language.Returns(Language.Parse("en"));

            item.Database.GetItem(
                item.ID,
                Arg.Any<Language>())
                .Returns((Item)null);

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, "fr");

            // Assert
            trackingId.Should().Be("fallback-name");
        }

        [Fact]
        public void GetTrackingId_ShouldReturnNameField_WhenItemAlreadyInRequestedLanguage()
        {
            // Arrange — same-language path reads the Name field and does not query for another version
            var item = new FakeItem()
                .WithName("item-name")
                .WithField("Name", "name-field-value")
                .ToSitecoreItem();
            item.Language.Returns(Language.Parse("en"));

            // Act
            var trackingId = ItemUtils.GetTrackingId(item, "en");

            // Assert
            trackingId.Should().Be("name-field-value");
            item.Database.DidNotReceive().GetItem(item.ID, Arg.Any<Language>());
        }
    }
}