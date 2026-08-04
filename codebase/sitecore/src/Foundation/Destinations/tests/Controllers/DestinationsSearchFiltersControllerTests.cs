using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class DestinationsSearchFiltersControllerTests
    {
        private readonly IDestinationsSearchFiltersService service;
        private readonly ISearchFiltersService searchFiltersService;
        private readonly DestinationsSearchFiltersController controller;
        private readonly IDestinationsLogger logger;

        public DestinationsSearchFiltersControllerTests()
        {
            service = Substitute.For<IDestinationsSearchFiltersService>();
            searchFiltersService = Substitute.For<ISearchFiltersService>();
            logger = Substitute.For<IDestinationsLogger>();
            controller = new DestinationsSearchFiltersController(service, searchFiltersService, logger);
        }

        [Theory]
        [AutoData]
        public void GetAllFilters_ShouldHasData(HotelsByIdsRequest request, List<HotelFilters> results)
        {
            // Arrange
            service.GetFilters(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = controller.GetAllFilters(request) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
        }

        [Theory]
        [MemberData(nameof(NotValidAtcomIdsRequest))]
        public void GetAllFilters_ShouldThrowExceptionIfIdsAbsent(HotelsByIdsRequest request)
        {
            // Arrange
            Action actual = () => controller.GetAllFilters(request);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Fact]
        public void GetFacilityMatrixConfiguration_ShouldHasData()
        {
            searchFiltersService.GetFacilityMatrixConfigurations().Returns(new List<FacilityMatrixConfiguration>());

            // Arrange
            var res = controller.GetFacilityMatrixConfiguration();

            // Assert
            res.Should().NotBeNull();
        }

        public static IEnumerable<object[]> NotValidAtcomIdsRequest
        {
            get
            {
                return new[]
                {
                    new object[] { new HotelsByIdsRequest() },
                    new object[]
                    {
                        new HotelsByIdsRequest()
                                       {
                                            AtcomIds = new string[0],
                                       }
                    }
                };
            }
        }
    }
}
