using System;
using System.Collections;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class HotelThemeControllerTests
    {
        private readonly IHotelThemesService hotelThemesService;
        private readonly IDestinationsLogger logger;
        private readonly ITrackerProvider trackerProviderService;
        private readonly HotelThemeController sut;

        public HotelThemeControllerTests()
        {
            hotelThemesService = Substitute.For<IHotelThemesService>();
            logger = Substitute.For<IDestinationsLogger>();
            trackerProviderService = Substitute.For<ITrackerProvider>();

            sut = Substitute.ForPartsOf<HotelThemeController>(hotelThemesService, logger, trackerProviderService);

            sut.ControllerContext = FakeControllerContext(sut);
            sut.Url = new UrlHelper(sut.ControllerContext.RequestContext);
            trackerProviderService.When(x => x.StartTracking(true)).Do(x => { });
        }

        [Fact]
        public void TriggerPatternCard_ShouldReturnBadRequest_IfTrackingIsNotAvailable()
        {
            // Arrange
            var type = "HotelType";

            // Act
            var actual = sut.TriggerPatternCard(type);

            // Assert
            Assert.IsType<HttpStatusCodeResult>(actual);
            var result = (HttpStatusCodeResult)actual;
            result.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Fact]
        public void TriggerPatternCard_ShouldThrowException_IfTypeEmpty()
        {
            // Arrange
            var type = string.Empty;

            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.TriggerPatternCard(type));
        }

        [Fact]
        public void TriggerPatternCard_ShouldReturnBadRequest_IfCurrentTrackerIsNotActive()
        {
            // Arrange
            var type = "HotelType";
            trackerProviderService.Enabled.Returns(true);

            // Act
            var actual = sut.TriggerPatternCard(type);

            // Assert
            Assert.IsType<HttpStatusCodeResult>(actual);
            var result = (HttpStatusCodeResult)actual;
            result.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Fact]
        public void TriggerPatternCard_ShouldReturnBadRequest_IfContactIsNull()
        {
            // Arrange
            var type = "HotelType";
            trackerProviderService.Enabled.Returns(true);

            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());
            trackerProviderService.CurrentTracker.Returns(tracker);

            // Act
            var actual = sut.TriggerPatternCard(type);

            // Assert
            Assert.IsType<HttpStatusCodeResult>(actual);
            var result = (HttpStatusCodeResult)actual;
            result.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Fact]
        public void TriggerPatternCard_ShouldReturnRequestOk_IfTrackingIsAvailable()
        {
            // Arrange
            var type = "HotelType";
            trackerProviderService.Enabled.Returns(true);

            var tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());
            trackerProviderService.CurrentTracker.Returns(tracker);

            // Act
            var actual = sut.TriggerPatternCard(type);

            // Assert
            Assert.IsType<HttpStatusCodeResult>(actual);
            var result = (HttpStatusCodeResult)actual;
            result.StatusCode.Should().Be((int)HttpStatusCode.OK);
        }

        private ControllerContext FakeControllerContext(ControllerBase controller)
        {
            var httpContextSub = Substitute.For<HttpContextBase>();
            var requestSub = Substitute.For<HttpRequestBase>();
            var responseSub = Substitute.For<HttpResponseBase>();
            var serverUtilitySub = Substitute.For<HttpServerUtilityBase>();
            var itemsSub = Substitute.For<IDictionary>();
            httpContextSub.Request.Returns(requestSub);
            httpContextSub.Response.Returns(responseSub);
            httpContextSub.Server.Returns(serverUtilitySub);
            httpContextSub.Items.Returns(itemsSub);
            serverUtilitySub.MapPath("/virtual").Returns("c:/absolute");
            requestSub.ApplicationPath.Returns("/basepath");
            requestSub.Url.Returns(new Uri("http://localhost:4000"));
            var routeData = new RouteData();
            routeData.Values.Add("key1", "value1");
            return new ControllerContext(httpContextSub, routeData, controller);
        }
    }
}