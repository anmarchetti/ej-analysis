using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Responses;
using FluentAssertions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class HotelHighlightsComputedFieldTest
    {
        private readonly HotelHighlightsComputedField computedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public HotelHighlightsComputedFieldTest()
        {
            computedField = new HotelHighlightsComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeField_FieldsDataShouldBeEqualToPassedData_IfHotelHighlightsItemNotNull()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var hotelHighlights = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            hotelHighlights.Fields.Add(Constants.Fields.CarouselTile.Title, "title 1");
            hotelHighlights.Fields.Add(Constants.Fields.CarouselTile.Subtitle, "subtitle 1");
            hotelHighlights.Fields.Add(Constants.Fields.CarouselTile.Description, "description 1");

            item.Fields.Add(Constants.Fields.AccommodationItem.HotelHighlights, hotelHighlights.ID.ToString());
            db.Add(item);
            db.Add(hotelHighlights);

            SitecoreIndexableItem indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = JsonConvert.DeserializeObject<HotelHighlights[]>(computedField.ComputeField(indexableItem).ToString());

            // Assert
            actual[0].Title.Should().BeEquivalentTo("title 1");
            actual[0].Subtitle.Should().BeEquivalentTo("subtitle 1");
            actual[0].Description.Should().BeEquivalentTo("description 1");
        }

        [Fact]
        public void ComputeField_ShouldBeNull_IfHotelItemNull()
        {
            // Arrange

            // Act
            var actual = computedField.ComputeField(null);

            // Assert
            actual.Should().BeNull();
        }
    }
}
