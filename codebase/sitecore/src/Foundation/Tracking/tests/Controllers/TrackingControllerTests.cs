using System;
using System.Web;
using System.Web.Http.Results;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Tracking.Controllers;
using easyJet.Foundation.Tracking.Logging;
using easyJet.Foundation.Tracking.Models.Requests;
using easyJet.Foundation.Tracking.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Xunit;

namespace easyJet.Foundation.Tracking.Tests.Controllers
{
    public class TrackingControllerTests
    {
        private readonly ITrackingLogger logger;
        private readonly IUserSearchInteractionService userSearchInteractionService;
        private readonly IUserSearchProfileService userSearchProfileService;
        private readonly ITrackingDataService trackingDataService;
        private readonly ITrackerProvider trackerProviderService;
        private readonly ITracker tracker;

        private readonly TrackingController controller;

        public TrackingControllerTests()
        {
            userSearchInteractionService = Substitute.For<IUserSearchInteractionService>();
            userSearchProfileService = Substitute.For<IUserSearchProfileService>();
            trackingDataService = Substitute.For<ITrackingDataService>();
            logger = Substitute.For<ITrackingLogger>();

            tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());

            trackerProviderService = Substitute.For<ITrackerProvider>();
            trackerProviderService.CurrentTracker.Returns(tracker);
            trackerProviderService.Enabled.Returns(true);

            controller = new TrackingController(trackerProviderService, userSearchInteractionService, userSearchProfileService, trackingDataService, logger);
        }

        [Fact]
        public void TrackHotelData_ShouldThrowException_IfUrlNull()
        {
            // Act
            Action actual = () => { controller.TrackHotelData(new TrackingHotelDataRequest() { Url = null }); };

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoData]
        public void TrackHotelData_ShouldTrackingData_IfUrlHaveValue(TrackingHotelDataRequest request)
        {
            // Act
            var actual = controller.TrackHotelData(request);

            // Assert
            actual.Should().BeOfType<HttpStatusCodeResult>();
            trackingDataService.Received().Update(Arg.Any<TrackingHotelDataRequest>());
        }

        [Fact]
        public void TrackUserSearch_ShouldThrowException_IfFromIsNull()
        {
            // Act
            using (new TrackerSwitcher(tracker))
            {
                Action actual = () => { controller.TrackUserSearch(new UserSearchRequest() { From = null }); };

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Fact]
        public void TrackUserSearch_ShouldThrowException_IfToIsNull()
        {
            // Act
            using (new TrackerSwitcher(tracker))
            {
                Action actual = () => { controller.TrackUserSearch(new UserSearchRequest() { To = null }); };

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Theory]
        [AutoData]
        public void TrackUserSearch_ShouldTrackUserSearch_IfUserSearchHasValue(UserSearchRequest request)
        {
            // Act
            var actual = controller.TrackUserSearch(request);

            // Assert
            actual.Should().BeOfType<HttpStatusCodeResult>();
            userSearchInteractionService.Received().Add(Arg.Any<UserSearchRequest>());
        }

        [Fact]
        public void TrackBookingData_ShouldThrowException_IfFAccIdIsNull()
        {
            // Act
            using (new TrackerSwitcher(tracker))
            {
                Action actual = () => { controller.TrackRecentBooking(new PushNotificationBookingRequest() { Image = "k", AccommodationId = null }); };

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Fact]
        public void TrackBookingData_ShouldThrowException_IfImageIsNull()
        {
            // Act
            using (new TrackerSwitcher(tracker))
            {
                Action actual = () => { controller.TrackRecentBooking(new PushNotificationBookingRequest() { Image = null, AccommodationId = "test" }); };

                // Assert
                actual.Should().Throw<ArgumentNullException>();
            }
        }

        [Theory]
        [AutoData]
        public void TrackBookingData_ShouldTrackingBooking(PushNotificationBookingRequest request)
        {
            using (new TrackerSwitcher(tracker))
            {
                // Act
                var actual = controller.TrackRecentBooking(request);

                // Assert
                actual.Should().BeOfType<HttpStatusCodeResult>();
                trackingDataService.Received().UpdateBooking(Arg.Any<PushNotificationBookingRequest>());
            }
        }
    }
}
