using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using NSubstitute;
using Sitecore.Collections;
using Sitecore.ContentSearch;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class SourceComputedFieldTests
    {
        private readonly SourceComputedField computedField;

        public SourceComputedFieldTests()
        {
            computedField = new SourceComputedField();
        }

        [Fact]
        public void ComputeField_ShouldReturnNull_IfHotelHasNoRoomFolders()
        {
            // Arrange
            var item = new FakeItem();
            ChildList list = null;
            item.ToSitecoreItem().Children.Returns(list);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(item));

            // Assert
            actual.Should().BeNull();
        }

        [Fact]
        public void ComputeField_ShouldReturnCodes_IfHotelHasRoomFolders()
        {
            // Arrange
            var accommodationItem = new FakeItem();

            var roomFolder1 = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, "сode1");
            var roomFolder2 = new FakeItem()
                .WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder)
                .WithField(Constants.Fields.DatasourceItem.Code, "сode2");

            accommodationItem
                .WithChild(roomFolder1)
                .WithChild(roomFolder2);

            // Act
            var actual = computedField.ComputeField(new SitecoreIndexableItem(accommodationItem)) as string[];

            // Assert
            actual.Length.Should().Be(2);
            actual[0].Should().Be("сode1");
            actual[1].Should().Be("сode2");
        }
    }
}
