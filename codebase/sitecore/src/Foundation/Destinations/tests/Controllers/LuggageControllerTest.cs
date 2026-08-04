using System.Collections.Generic;
using System.Web.Mvc;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class LuggageControllerTest
    {
        private readonly ILuggageService luggageService;

        private readonly LuggageController controller;

        public LuggageControllerTest()
        {
            luggageService = Substitute.For<ILuggageService>();
            controller = new LuggageController(luggageService);
        }

        [Fact]
        public void Get_ShouldBeNotNull_IfHasLuggageData()
        {
            // Arrange
            string language = "en";
            luggageService.GetLuggage(Arg.Any<string>()).Returns(i => new LuggageRoot());

            // Act
            var actual = controller.Get(language) as JsonResult;

            // Assert
            actual.Data.Should().NotBeNull();
            var response = actual.Data as LuggageRoot;
            response.Should().NotBeNull();
        }
    }
}
