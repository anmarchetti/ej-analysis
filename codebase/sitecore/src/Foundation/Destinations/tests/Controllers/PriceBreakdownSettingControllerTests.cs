using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class PriceBreakdownSettingControllerTests
    {
        private readonly PriceBreakdownSettingController controller;
        private readonly IPriceBreakdownSettingService service;
        private readonly IDestinationsLogger logger;

        public PriceBreakdownSettingControllerTests()
        {
            // Arrange
            service = Substitute.For<IPriceBreakdownSettingService>();
            logger = Substitute.For<IDestinationsLogger>();
            controller = new PriceBreakdownSettingController(service, logger);
        }

        [Fact]
        public void Get_ShouldBeNotNull_IfServiceReturnData()
        {
            // Arrange
            service.GetPriceBreakdownSettings().Returns(new Dictionary<string, PriceBreakdownSetting>());

            // Act
            var actual = (controller.Get() as JsonResult).Data;

            // Assert
            actual.Should().BeOfType(typeof(Dictionary<string, PriceBreakdownSetting>));
            actual.Should().NotBeNull();
        }
    }
}
