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
    public class AccommodationAirportsComputedFieldTests
    {
        private readonly AirportCodesComputedField airportsComputedField;
        private readonly Fixture fixture;
        private readonly Db db;

        public AccommodationAirportsComputedFieldTests()
        {
            // Arrange
            airportsComputedField = new AirportCodesComputedField();
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void ComputeField_ShouldBeNullOrEmpty_IfFieldHasNoAirports()
        {
            // Arrange
            var accomadationDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadationDbItem.Name = "Spain";
            accomadationDbItem.Fields.Add(Constants.Fields.AccommodationItem.Airports, string.Empty);

            db.Add(accomadationDbItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(accomadationDbItem.ID));

            // Act
            var actual = airportsComputedField.ComputeField(indexableItem) as List<string>;

            // Assert
            actual.Should().BeNullOrEmpty();
        }

        [Fact]
        public void ComputeField_ShouldNotBeEmpty_IfFieldHasAirports()
        {
            // Arrange
            var accomadationDbItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            accomadationDbItem.TemplateID = Constants.TemplateIds.Accommodation;
            var airport1 = GetAirport("UK", "LN", "London");
            var airport2 = GetAirport("Spain", "BC", "Barcelona");

            accomadationDbItem.Fields.Add(Constants.Fields.AccommodationItem.Airports, $"{airport1.ID}|{airport2.ID}");

            db.Add(airport1);
            db.Add(airport2);
            db.Add(accomadationDbItem);

            var indexableItem = new SitecoreIndexableItem(db.GetItem(accomadationDbItem.ID));

            // Act
            var actual = airportsComputedField.ComputeField(indexableItem) as string[];

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [MemberData(nameof(ValidTemplates))]
        public void IsValid_SholdBeTrue_IfValidTemplate(ID templateId)
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = templateId;
            db.Add(item);

            // Act
            var actual = airportsComputedField.IsValid(new SitecoreIndexableItem(db.GetItem(item.ID)));

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void IsValid_SholdBeFalse_IfNoValidTemplate()
        {
            // Arrange
            var item = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            item.TemplateID = ID.NewID;
            db.Add(item);

            // Act
            var actual = airportsComputedField.IsValid(new SitecoreIndexableItem(db.GetItem(item.ID)));

            // Assert
            actual.Should().BeFalse();
        }

        private DbItem GetAirport(string countryName, string code, string airportName)
        {
            var airportGroup = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            airportGroup.Fields.Add(Constants.Fields.DatasourceItem.Name, countryName);

            var airport = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            airport.Fields.Add(Constants.Fields.DatasourceItem.Code, code);
            airport.Fields.Add(Constants.Fields.DatasourceItem.Name, airportName);
            airport.ParentID = airportGroup.ID;

            db.Add(airportGroup);
            return airport;
        }

        public static IEnumerable<object[]> ValidTemplates =>
            new[]
            {
                new object[] { Constants.TemplateIds.Country },
                new object[] { Constants.TemplateIds.Location },
                new object[] { Constants.TemplateIds.LocationCity },
                new object[] { Constants.TemplateIds.Resort },
                new object[] { Constants.TemplateIds.Accommodation },
                new object[] { Constants.TemplateIds.VirtualCountry },
                new object[] { Constants.TemplateIds.VirtualRegion },
                new object[] { Constants.TemplateIds.VirtualResort },
            };
    }
}
