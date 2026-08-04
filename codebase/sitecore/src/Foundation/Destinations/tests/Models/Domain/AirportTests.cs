using AutoFixture;
using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class AirportTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public AirportTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void AirportConstructor_ShouldNotSetValues_IfFieldsNotExist()
        {
            // Arrange
            var airportParentItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var airportItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            airportParentItem.Children.Add(airportItem);

            db.Add(airportParentItem);

            // Act
            var actual = new Airport(db.GetItem(airportItem.ID));

            // Assert
            actual.AirportGroup.Should().BeNull();
            actual.IsDepartureAirport.Should().BeNull();
        }
    }
}
