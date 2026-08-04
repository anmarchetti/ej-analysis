using System.Collections;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using easyJet.Foundation.Analytics.Controllers;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Logger;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Controllers
{
    public class BaseAnalyticsControllerTests
    {
        private readonly ILogger logger;
        private readonly ITrackerProvider trackerProvider;
        private readonly TestBaseAnalyticsController sut;

        public BaseAnalyticsControllerTests()
        {
            logger = Substitute.For<ILogger>();
            trackerProvider = Substitute.For<ITrackerProvider>();
            sut = new TestBaseAnalyticsController(logger, trackerProvider)
            {
                ControllerContext = BuildControllerContext()
            };
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnBadRequest_WhenTrackerProviderIsDisabled()
        {
            // Arrange
            trackerProvider.Enabled.Returns(false);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("Tracker is disabled.");
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnBadRequest_WhenCurrentTrackerIsMissing()
        {
            // Arrange
            trackerProvider.Enabled.Returns(true);
            trackerProvider.CurrentTracker.Returns((ITracker)null);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("Tracker is inactive.");
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnBadRequest_WhenCurrentTrackerIsInactive()
        {
            // Arrange
            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(false);
            trackerProvider.Enabled.Returns(true);
            trackerProvider.CurrentTracker.Returns(tracker);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("Tracker is inactive.");
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnBadRequest_WhenContactIsMissing()
        {
            // Arrange
            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns((Contact)null);
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());
            trackerProvider.Enabled.Returns(true);
            trackerProvider.CurrentTracker.Returns(tracker);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("No contact");
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnBadRequest_WhenInteractionIsMissing()
        {
            // Arrange
            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns((CurrentInteraction)null);
            trackerProvider.Enabled.Returns(true);
            trackerProvider.CurrentTracker.Returns(tracker);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("No interaction");
        }

        [Fact]
        public void AssertTrackerOperational_ShouldReturnNull_WhenTrackerIsOperational()
        {
            // Arrange
            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());
            trackerProvider.Enabled.Returns(true);
            trackerProvider.CurrentTracker.Returns(tracker);

            // Act
            var result = sut.CallAssertTrackerOperational();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BadRequestWithString_ShouldReturnHttpStatusCodeResult()
        {
            // Act
            var result = sut.CallBadRequest("invalid request");

            // Assert
            result.Should().BeOfType<HttpStatusCodeResult>();
            var badRequest = (HttpStatusCodeResult)result;
            badRequest.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            badRequest.StatusDescription.Should().Be("invalid request");
            sut.Response.TrySkipIisCustomErrors.Should().BeTrue();
        }

        [Fact]
        public void BadRequestWithObject_ShouldReturnJsonResultAndSetResponseCode()
        {
            // Arrange
            var payload = new { Message = "invalid request" };

            // Act
            var result = sut.CallBadRequest(payload);

            // Assert
            result.Should().BeOfType<JsonResult>();
            var jsonResult = (JsonResult)result;
            jsonResult.Data.Should().Be(payload);
            sut.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            sut.Response.TrySkipIisCustomErrors.Should().BeTrue();
        }

        private static ControllerContext BuildControllerContext()
        {
            var httpContext = Substitute.For<HttpContextBase>();
            var request = Substitute.For<HttpRequestBase>();
            var response = Substitute.For<HttpResponseBase>();
            var server = Substitute.For<HttpServerUtilityBase>();
            var items = Substitute.For<IDictionary>();

            httpContext.Request.Returns(request);
            httpContext.Response.Returns(response);
            httpContext.Server.Returns(server);
            httpContext.Items.Returns(items);
            request.ApplicationPath.Returns("/");
            request.Url.Returns(new System.Uri("http://localhost"));
            server.MapPath("/").Returns("c:/");

            return new ControllerContext(httpContext, new RouteData(), Substitute.For<ControllerBase>());
        }

        private class TestBaseAnalyticsController : BaseAnalyticsController
        {
            public TestBaseAnalyticsController(ILogger logger, ITrackerProvider trackerProvider)
                : base(logger, trackerProvider)
            {
            }

            public ActionResult CallAssertTrackerOperational()
            {
                return AssertTrackerOperational();
            }

            public ActionResult CallBadRequest(string description)
            {
                return BadRequest(description);
            }

            public ActionResult CallBadRequest(object payload)
            {
                return BadRequest(payload);
            }
        }
    }
}
