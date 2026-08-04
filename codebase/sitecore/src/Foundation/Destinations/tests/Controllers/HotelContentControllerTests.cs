using System;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class HotelContentControllerTests
    {
        private readonly IExpediaHotelContentUpsertService hotelContentService;
        private readonly IDestinationsLogger logger;
        private readonly HotelContentController controller;

        public HotelContentControllerTests()
        {
            hotelContentService = Substitute.For<IExpediaHotelContentUpsertService>();
            logger = Substitute.For<IDestinationsLogger>();

            controller = new HotelContentController(hotelContentService, logger);

            var httpContext = Substitute.For<HttpContextBase>();
            var httpResponse = Substitute.For<HttpResponseBase>();

            httpContext.Response.Returns(httpResponse);

            controller.ControllerContext = new ControllerContext(
                httpContext,
                new RouteData(),
                controller);
        }

        [Fact]
        public void UpsertHotel_ShouldReturnBadRequest_WhenRequestIsNull()
        {
            // Act
            var result = controller.UpsertHotel(null);

            // Assert
            var statusResult = result.Should().BeOfType<HttpStatusCodeResult>().Subject;
            statusResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            statusResult.StatusDescription.Should().Be("Request body is required.");

            hotelContentService.DidNotReceiveWithAnyArgs().UpsertFromExpedia(default);
        }

        [Fact]
        public void UpsertHotel_ShouldReturnBadRequest_WhenGiataCodeAndSitecoreIdAreMissing()
        {
            // Arrange
            var request = new UpsertHotelRequest();

            // Act
            var result = controller.UpsertHotel(request);

            // Assert
            var statusResult = result.Should().BeOfType<HttpStatusCodeResult>().Subject;
            statusResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            statusResult.StatusDescription.Should().Be("Either GiataCode or SitecoreId must be provided.");

            hotelContentService.DidNotReceiveWithAnyArgs().UpsertFromExpedia(default);
        }

        [Fact]
        public void UpsertHotel_ShouldReturnCreated_WhenHotelWasCreated()
        {
            // Arrange
            var request = new UpsertHotelRequest
            {
                GiataCode = "36363636"
            };

            var expectedResult = new HotelUpsertResult
            {
                Created = true,
                SitecoreId = "{11111111-1111-1111-1111-111111111111}"
            };

            hotelContentService.UpsertFromExpedia(request)
                .Returns(expectedResult);

            // Act
            var result = controller.UpsertHotel(request);

            // Assert
            var jsonResult = result.Should().BeOfType<JsonResult>().Subject;
            jsonResult.Data.Should().BeEquivalentTo(expectedResult);

            controller.Response.StatusCode.Should().Be((int)HttpStatusCode.Created);

            hotelContentService.Received(1).UpsertFromExpedia(request);
        }

        [Fact]
        public void UpsertHotel_ShouldReturnOk_WhenHotelWasUpdated()
        {
            // Arrange
            var request = new UpsertHotelRequest
            {
                SitecoreId = "{11111111-1111-1111-1111-111111111111}"
            };

            var expectedResult = new HotelUpsertResult
            {
                Created = false,
                SitecoreId = request.SitecoreId
            };

            hotelContentService.UpsertFromExpedia(request)
                .Returns(expectedResult);

            // Act
            var result = controller.UpsertHotel(request);

            // Assert
            var jsonResult = result.Should().BeOfType<JsonResult>().Subject;
            jsonResult.Data.Should().BeEquivalentTo(expectedResult);

            controller.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);

            hotelContentService.Received(1).UpsertFromExpedia(request);
        }

        [Fact]
        public void UpsertHotel_ShouldReturnInternalServerError_WhenServiceThrows()
        {
            // Arrange
            var request = new UpsertHotelRequest
            {
                GiataCode = "36363636"
            };

            hotelContentService
                .When(x => x.UpsertFromExpedia(request))
                .Do(_ => throw new InvalidOperationException("Test exception"));

            // Act
            var result = controller.UpsertHotel(request);

            // Assert
            var statusResult = result.Should().BeOfType<HttpStatusCodeResult>().Subject;
            statusResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);

            hotelContentService.Received(1).UpsertFromExpedia(request);
            logger.Received(1).Error(
                Arg.Is<string>(x => x.Contains("Error while upserting hotel content")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }
    }
}