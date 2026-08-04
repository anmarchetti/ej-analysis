using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using FluentAssertions;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Mappers
{
    public class AirportsMapperTests
    {
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
        private AirportsMapper _sut;

        public AirportsMapperTests()
        {
            _referenceDataServiceMock = new();
            _sut = new(_referenceDataServiceMock.Object);
        }

        [Fact]
        public void EnrichWithAirportNames_EmptyValues_NoError()
        {
            // Arrange
            _referenceDataServiceMock.Setup(x => x.GetAirports()).ReturnsAsync(new Dictionary<string, Domain.Data.ReferenceData.Airport>());

            Func<Task> nullOffersAct = async () => await _sut.EnrichAirportsDetails(null);

            // Assert
            nullOffersAct.Should().NotThrowAsync();
        }

        [Fact]
        public void EnrichWithAirportNames_NullValues_NoError()
        {
            // Arrange
            _referenceDataServiceMock.Setup(x => x.GetAirports()).ReturnsAsync((Dictionary<string, Domain.Data.ReferenceData.Airport>)null);

            Func<Task> nullOffersAct = async () => await _sut.EnrichAirportsDetails(new List<Domain.Data.PackageOffers.Route>());

            // Assert
            nullOffersAct.Should().NotThrowAsync();
        }

        [Fact]
        public async Task EnrichWithAirportNames_ValidData_ShouldMapAirportNames()
        {
            // Arrange

            var routes = new List<Domain.Data.PackageOffers.Route>() {
                new () {
                    DepPt = "MAD",
                    ArrPt = "LGW",
                },
                new () {
                    DepPt = "QWE",
                    ArrPt = "MAD",
                },
            };
            var airports = new Dictionary<string, Domain.Data.ReferenceData.Airport>() {
                { "LGW", new() {Name = "London Gatwick"}},
                { "MAD", new() {Name = "Madrid"}},
            };

            _referenceDataServiceMock.Setup(x => x.GetAirports()).ReturnsAsync(airports);

            // Act
            await _sut.EnrichAirportsDetails(routes);

            // Assert
            routes[0].DepName.Should().Be("Madrid");
            routes[0].ArrName.Should().Be("London Gatwick");

            routes[1].DepName.Should().Be("QWE");
            routes[1].ArrName.Should().Be("Madrid");
        }
    }
}
