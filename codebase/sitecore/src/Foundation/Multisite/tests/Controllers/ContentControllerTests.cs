using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Controllers;
using easyJet.Foundation.Multisite.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Multisite.Tests.Controllers
{
    public class ContentControllerTests
    {
        private readonly IContentService service;
        private readonly ContentController controller;

        public ContentControllerTests()
        {
            service = Substitute.For<IContentService>();
            controller = new ContentController(service);
        }

        [Fact]
        public void ByPath_ShouldThrowArgumentException_IfPathNull()
        {
            // Act
            Action actual = () => controller.ByPath(null, false);

            // Assert
            actual.Should().Throw<ArgumentException>();
        }

        [Theory]
        [AutoData]
        public void ByPath_ShouldReturnRightData_IfDataExists(string path, Dictionary<string, object> content)
        {
            // Arrange
            service.GetContentByPath(Arg.Any<string>(), Arg.Any<bool>()).ReturnsForAnyArgs(content);

            // Act
            var actual = (controller.ByPath(path, false) as JsonResult).Data;

            // Assert
            actual.Should().BeSameAs(content);
        }
    }
}
