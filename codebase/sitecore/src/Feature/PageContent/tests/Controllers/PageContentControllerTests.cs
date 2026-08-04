using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Feature.PageContent.Controllers;
using easyJet.Feature.PageContent.Models;
using easyJet.Feature.PageContent.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Feature.PageContent.Tests.Controllers
{
    public class PageContentControllerTests
    {
        private readonly PageContentController controller;
        private readonly IHealthEntryRequirementsService healthEntryRequirementsService;
        private readonly IRecommendedDestinationService recommendedDestinationService;

        public PageContentControllerTests()
        {
            // Arrange
            healthEntryRequirementsService = Substitute.For<IHealthEntryRequirementsService>();
            recommendedDestinationService = Substitute.For<IRecommendedDestinationService>();
            controller = new PageContentController(healthEntryRequirementsService, recommendedDestinationService);
        }

        [Theory]
        [InlineData("")]
        [InlineData("  ")]
        [InlineData(null)]
        public void GetTitles_ThrowArgumentException_IfRequestIsNotValid(string airportCode)
        {
            // Act
            Action actual = () => controller.GetHealthEntryRequirements(airportCode);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [InlineData("")]
        [InlineData("  ")]
        [InlineData(null)]
        public void GetFlightAndHotelHealthEntryRequirements_ThrowArgumentException_IfRequestIsNotValid(string airportCode)
        {
            // Act
            Action actual = () => controller.GetFlightAndHotelHealthEntryRequirements(airportCode);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void GetHealthEntryRequirements(string code, List<HealthEntryRequirementTile> expected)
        {
            // Arrange
            healthEntryRequirementsService.Get(Arg.Any<string>()).Returns(expected);

            // Act
            var actual = (controller.GetHealthEntryRequirements(code) as JsonResult).Data as List<HealthEntryRequirementTile>;

            // Assert
            actual.Should().HaveCount(expected.Count);
        }

        [Theory]
        [AutoData]
        public void GetFlightAndHotelHealthEntryRequirements(string code, List<HealthEntryRequirementTile> expected)
        {
            // Arrange
            healthEntryRequirementsService.GetFlightAndHotelHealthEntryRequirements(Arg.Any<string>()).Returns(expected);

            // Act
            var actual = (controller.GetFlightAndHotelHealthEntryRequirements(code) as JsonResult).Data as List<HealthEntryRequirementTile>;

            // Assert
            actual.Should().HaveCount(expected.Count);
        }

        [Theory]
        [AutoData]
        public void GetAllRecommendedDestinations(Dictionary<string, RecommendedDestination> expected)
        {
            // Arrange
            recommendedDestinationService.GetAll().Returns(expected);

            // Act
            var actual = (controller.GetAllRecommendedDestinations() as JsonResult).Data as Dictionary<string, RecommendedDestination>;

            // Assert
            actual.Should().HaveCount(expected.Count);
        }
    }
}
