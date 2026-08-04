using System.Collections.Generic;
using AutoFixture;
using easyJet.Foundation.Destinations.ContentSearch.Fields;
using FluentAssertions;
using Sitecore.ContentSearch;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentSearch.Fields
{
    public class AirportCodesComputedFieldTests
    {
        private readonly Fixture fixture;
        private readonly Db db;
        private readonly AirportCodesComputedField computedField;

        public AirportCodesComputedFieldTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            computedField = new AirportCodesComputedField();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_ShouldReturnTrue_IfItemHasValidTemplate(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.IsValid(indexableItem);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ValidAirportCodesTemplates))]
        public void ComputedField_ShouldNotBeNull_IfHotelOfParentHasAirportWithCode(string airportCode, ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;

            var hotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            hotel.TemplateID = Constants.TemplateIds.Accommodation;

            var airport = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var airportCodeField = new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = airportCode
            };

            airport.Fields.Add(airportCodeField);

            var airportsField = new DbField(Constants.Fields.AccommodationItem.Airports)
            {
                Value = airport.ID.ToString()
            };

            hotel.Fields.Add(airportsField);

            item.Children.Add(hotel);
            db.Add(airport);
            db.Add(item);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(ValidAirportCodesVirtualTemplates))]
        public void ComputedField_ShouldNotBeNull_IfHotelOfVirtualParentHasAirportWithCode(string airportCode, ID virtualTemplateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = virtualTemplateId;

            var region = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var hotel = fixture.Build<DbItem>().With(x => x.ParentID, region.ID).Create();
            hotel.TemplateID = Constants.TemplateIds.Accommodation;

            var airport = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var airportCodeField = new DbField(Constants.Fields.DatasourceItem.Code)
            {
                Value = airportCode
            };

            airport.Fields.Add(airportCodeField);

            var airportsField = new DbField(Constants.Fields.AccommodationItem.Airports)
            {
                Value = airport.ID.ToString()
            };

            hotel.Fields.Add(airportsField);

            var regionsField = new DbField(Constants.Fields.VirtualDestination.Regions)
            {
                Value = region.ID.ToString()
            };

            item.Fields.Add(regionsField);

            db.Add(item);
            db.Add(region);
            db.Add(hotel);
            db.Add(airport);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(item.ID));

            // Act
            var actual = computedField.ComputeField(indexableItem);

            // Assert
            actual.Should().NotBeNull();
        }

        public static IEnumerable<object[]> ValidTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { Constants.TemplateIds.Country },
                    new object[] { Constants.TemplateIds.Location },
                    new object[] { Constants.TemplateIds.Resort },
                    new object[] { Constants.TemplateIds.Accommodation },
                    new object[] { Constants.TemplateIds.VirtualCountry },
                    new object[] { Constants.TemplateIds.VirtualRegion }
                };
            }
        }

        public static IEnumerable<object[]> ValidAirportCodesTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { "fakecode", Constants.TemplateIds.Country },
                    new object[] { "fakecode", Constants.TemplateIds.Location },
                    new object[] { "fakecode", Constants.TemplateIds.Resort }
                };
            }
        }

        public static IEnumerable<object[]> ValidAirportCodesVirtualTemplates
        {
            get
            {
                return new[]
                {
                    new object[] { "fakecode", Constants.TemplateIds.VirtualCountry },
                    new object[] { "fakecode", Constants.TemplateIds.VirtualRegion }
                };
            }
        }
    }
}
