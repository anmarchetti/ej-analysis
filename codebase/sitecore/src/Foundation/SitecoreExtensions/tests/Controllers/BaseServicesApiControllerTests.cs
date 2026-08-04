using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Controllers
{
    public class BaseServicesApiControllerTests
    {
        private readonly BaseServicesApiController controller;

        public BaseServicesApiControllerTests()
        {
            controller = new BaseServicesApiController();
        }

        [Theory]
        [AutoData]
        public void UnlimitedJson_ShouldReturnJsonObject(object data)
        {
            // Act
            var act = controller.UnlimitedJson(data, JsonRequestBehavior.DenyGet);

            // Assert
            act.Should().BeOfType<JsonResult>();
        }
    }
}
