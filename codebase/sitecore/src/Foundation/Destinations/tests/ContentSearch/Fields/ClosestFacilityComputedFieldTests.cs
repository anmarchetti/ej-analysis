using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ClosestFacilityComputedFieldTests
    {
        private readonly ClosestFacilityComputedField closestFacilityComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public ClosestFacilityComputedFieldTests()
        {
            // Arrange
            closestFacilityComputedField = new ClosestFacilityComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeFieldValue_ShouldBeNull_IfNotValidTemplate()
        {
            // Arrange
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var accomadationroomDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadationroomDbItem.TemplateID = Constants.TemplateIds.AccommodationRoom;

            facilities.Children.Add(accomadationroomDbItem);
            db.Add(facilities);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(facilities.ID));

            // Act
            var actual = closestFacilityComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("    ")]
        public void ComputeFieldValue_ShouldBeNull_IfDistanceIsNotValid(string distance)
        {
            // Arrange
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var accomadationFacilityDbItem = GetAccommodationFacilityDbItem(distance);

            facilities.Children.Add(accomadationFacilityDbItem);
            db.Add(facilities);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(facilities.ID));

            // Act
            var actual = closestFacilityComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [InlineData("57")]
        public void ComputeFieldValue_ShouldBeNull_IfNoFacilityType(string distance)
        {
            // Arrange
            var facilities = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var accomadationFacilityDbItem = GetAccommodationFacilityDbItem(distance);

            facilities.Children.Add(accomadationFacilityDbItem);
            db.Add(facilities);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(facilities.ID));

            // Act
            var actual = closestFacilityComputedField.ComputeField(indexableItem);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [InlineData("57", true, "Beach")]
        [InlineData("5000", true, "Beach")]
        public void ComputeFieldValue_ShouldBeNotNull_IfDistanceHasValidDistanceAndValidFacilityType(
            string distance, bool hasFacilityType, string typeName)
        {
            // Arrange
            var accomadationDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var hotelThemeDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelThemeDbItem.Name = "Beach";

            accomadationDbItem.Fields.Add(Constants.Fields.AccommodationItem.HotelTheme, hotelThemeDbItem.ID.ToString());

            var facilitiesDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            facilitiesDbItem.TemplateID = Constants.AccommodationReferences.Facilities.Key;
            var accommodationFacilityDbItem = GetAccommodationFacilityDbItem(distance, hasFacilityType, typeName);
            accommodationFacilityDbItem.TemplateID = Constants.AccommodationReferences.Facilities.Value;

            facilitiesDbItem.Children.Add(accommodationFacilityDbItem);
            accomadationDbItem.Children.Add(facilitiesDbItem);

            db.Add(hotelThemeDbItem);
            db.Add(accomadationDbItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(accomadationDbItem.ID));

            using (new SettingsSwitcher("Destinations.ClosestFacilityByHotelThemeMaping", "City,City centre|Beach,Beach"))
            {
                // Act
                var actual = closestFacilityComputedField.ComputeField(indexableItem);

                // Assert
                actual.Should().NotBeNull();
            }
        }

        private DbItem GetAccommodationFacilityDbItem(string distance, bool hasFacilityType = false, string typeName = "")
        {
            var accommodationFacilityDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accommodationFacilityDbItem.TemplateID = Constants.TemplateIds.AccommodationFacility;
            accommodationFacilityDbItem.Fields.Add(Constants.Fields.AccommodationFacilityItem.Distance, distance);

            if (hasFacilityType)
            {
                AddFacilityTypeField(accommodationFacilityDbItem, typeName);
            }

            return accommodationFacilityDbItem;
        }

        private void AddFacilityTypeField(DbItem accomadationFacilityDbItem, string typeName = "")
        {
            var facilityTypeDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityTypeDbItem.Name = typeName != string.Empty ? typeName : facilityTypeDbItem.Name;
            var facilityTypeDbField = new DbField(Constants.Fields.BaseFacilityItem.FacilityType)
            {
                Type = "Lookup",
                Value = facilityTypeDbItem.ID.ToString()
            };

            accomadationFacilityDbItem.Fields.Add(facilityTypeDbField);
            db.Add(facilityTypeDbItem);
        }

        private DbField GetLookupField(string lookupFieldname, DbItem referenceDbItem = null)
        {
            referenceDbItem = referenceDbItem ?? fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var referenceDbField = new DbField(lookupFieldname)
            {
                Type = "Lookup",
                Value = referenceDbItem.ID.ToString()
            };

            db.Add(referenceDbItem);
            return referenceDbField;
        }
    }
}
