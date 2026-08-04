using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class AirportsServiceTests
    {
        private readonly IAirportRepository airportRepository;
        private readonly ICustomCacheRepository cacheRepository;

        private readonly AirportsService airportsService;

        public AirportsServiceTests()
        {
            airportRepository = Substitute.For<IAirportRepository>();
            cacheRepository = Substitute.For<ICustomCacheRepository>();
            cacheRepository.StoreItem(Arg.Any<string>(), Arg.Any<Dictionary<string, ID>>(), Arg.Any<int>());

            airportsService = new AirportsService(airportRepository, cacheRepository);
        }

        [Fact]
        public void GetAccommodationAirportsField_ShouldReturnEmptyString_IfAirportsCodesWhereNotSupplied()
        {
            // Act
            var actual = airportsService.GetAccommodationAirportsField(null, null);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetAccommodationAirportsField_ShouldReturnEmptyString_IfAirportsWereNotFoundEitherCacheOrRepository(string[] airportCodes)
        {
            // Arrange
            cacheRepository.GetItem<Dictionary<string, ID>>(Arg.Any<string>()).ReturnsForAnyArgs(m => null);
            airportRepository.GetAirportCodesItemIds().ReturnsForAnyArgs(m => null);

            // Act
            var actual = airportsService.GetAccommodationAirportsField(null, airportCodes);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetAccommodationAirportsField_ShouldReturnPipedString_IfAirportsExistInCache(Dictionary<string, ID> airportsIdsByCodes)
        {
            // Arrange
            cacheRepository.GetItem<Dictionary<string, ID>>(Arg.Any<string>()).ReturnsForAnyArgs(airportsIdsByCodes);

            // Act
            var actual = airportsService.GetAccommodationAirportsField(null, airportsIdsByCodes.Keys);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetAccommodationAirportsField_ShouldReturnPipedString_IfAirportsExistInRepository(Dictionary<string, ID> airportsIdsByCodes)
        {
            // Arrange
            airportRepository.GetAirportCodesItemIds().Returns(airportsIdsByCodes);

            // Act
            var actual = airportsService.GetAccommodationAirportsField(null, airportsIdsByCodes.Keys);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
