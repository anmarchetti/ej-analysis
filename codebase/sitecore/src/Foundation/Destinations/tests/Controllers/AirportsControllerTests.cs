using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class AirportsControllerTests
    {
        private readonly AirportsController controller;
        private readonly IAirportsService repository;
        private readonly IDestinationsLogger logger;

        public AirportsControllerTests()
        {
            // Arrange
            repository = Substitute.For<IAirportsService>();
            logger = Substitute.For<IDestinationsLogger>();
            controller = new AirportsController(repository, logger);
        }

        [Theory]
        [AutoData]
        public void Get_ShouldHasData(List<Airport> airports, string code)
        {
            // Arrange
            repository.GetAirportsByCountryCodes(Arg.Any<string[]>()).Returns(airports);

            // Act
            var actual = ((controller.Get(code) as JsonResult).Data as IEnumerable<Airport>).FirstOrDefault();

            // Assert
            var expected = airports.FirstOrDefault();

            actual.Name.Should().Be(expected.Name);
            actual.IsDepartureAirport.Should().Be(expected.IsDepartureAirport);
            actual.Code.Should().Be(expected.Code);
        }
    }
}
