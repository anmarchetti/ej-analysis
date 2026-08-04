using System.Web.Mvc;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class ClosestFacilitiesComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        private readonly ClosestFacilitiesComputedField computedField;

        public ClosestFacilitiesComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            computedField = new ClosestFacilitiesComputedField();
        }

        [Fact]
        public void ComputeField_ShouldNotBeNull_IfThemeWithClosestFacilityCodeExist()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityType = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            facilityType.Name = "City centre";

            var facilityTypeField = new DbField(Constants.Fields.BaseFacilityItem.FacilityType)
            {
                Type = "LookupField",
                Value = facilityType.ID.ToString()
            };

            var accomodationFacility = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomodationFacility.TemplateID = Constants.TemplateIds.AccommodationFacility;

            var distanceField = new DbField(Constants.Fields.AccommodationFacilityItem.Distance)
            {
                Value = "1000"
            };

            accomodationFacility.Fields.Add(distanceField);
            accomodationFacility.Fields.Add(facilityTypeField);

            item.Children.Add(accomodationFacility);
            db.Add(facilityType);
            db.Add(item);

            var dataFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dataFolder.Name = "Data";

            var hotelThemesFolder = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelThemesFolder.TemplateID = Constants.TemplateIds.HotelThemesFolder;

            var hotelTheme = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotelTheme.TemplateID = Constants.TemplateIds.HotelTheme;

            var hotelThemeNameField = new DbField(Constants.Fields.DatasourceItem.Name)
            {
                Value = "City"
            };

            var hotelThemeCodeField = new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = "City centre"
            };

            hotelTheme.Fields.Add(hotelThemeNameField);
            hotelTheme.Fields.Add(hotelThemeCodeField);

            hotelThemesFolder.Children.Add(hotelTheme);

            dataFolder.Children.Add(hotelThemesFolder);
            db.Add(dataFolder);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
                });

            // Act
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            using (new SettingsSwitcher("Destinations.ClosestFacilityByHotelThemeMaping", "City,City centre|Beach,Beach"))
            {
                var actual = computedField.ComputeField(indexableItem);

                // Assert
                actual.Should().NotBeNull();
            }
        }
    }
}
