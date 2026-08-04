using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class VideoThumbnailImageComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly VideoThumbnailImageComputedField computedField;

        public VideoThumbnailImageComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
            computedField = new VideoThumbnailImageComputedField();
        }

        [Fact]
        public void IsValid_ShouldBeTrue_IfAccommodationTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = Constants.TemplateIds.Accommodation;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
