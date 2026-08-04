using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Models.Domain;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class HotelThemeComputedFieldTest
    {
        private readonly HotelThemeComputedField computedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public HotelThemeComputedFieldTest()
        {
            computedField = new HotelThemeComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Theory]
        [AutoDbData]
        public void ComputeField_FieldsDataShoudBeEquelToPassedData_IfThemeItemNotNull(
            string name,
            string code,
            string icon,
            string description)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var hotelTheme = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            hotelTheme.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
            hotelTheme.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            hotelTheme.Fields.Add(Constants.Fields.HotelThemeItem.Icon, icon);
            hotelTheme.Fields.Add(Constants.Fields.HotelThemeItem.Description, description);

            item.Fields.Add(Constants.Fields.AccommodationItem.HotelTheme, hotelTheme.ID.ToString());
            db.Add(item);
            db.Add(hotelTheme);

            SitecoreIndexableItem indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = JsonConvert.DeserializeObject<HotelTheme>(computedField.ComputeField(indexableItem).ToString());

            // Assert
            actual.Name.Should().BeEquivalentTo(name);
        }

        [Fact]
        public void ComputeField_ShoudBeNull_IfHotelItemNull()
        {
            // Arrange

            // Act
            var actual = computedField.ComputeField(null);

            // Assert
            actual.Should().BeNull();
        }
    }
}
