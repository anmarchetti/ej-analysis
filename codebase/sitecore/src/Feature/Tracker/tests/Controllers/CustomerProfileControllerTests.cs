using System;
using System.Web.Mvc;
using easyJet.Feature.Tracker.Controllers;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Requests;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Controllers
{
    public class CustomerProfileControllerTests
    {
        private readonly ITrackerLogger logger;
        private readonly ICustomerProfileService customerProfileService;
        private readonly ITrackerProvider trackerProviderService;
        private readonly ITracker tracker;

        private readonly CustomerProfileController controller;

        public CustomerProfileControllerTests()
        {
            customerProfileService = Substitute.For<ICustomerProfileService>();
            logger = Substitute.For<ITrackerLogger>();

            tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());

            trackerProviderService = Substitute.For<ITrackerProvider>();
            trackerProviderService.CurrentTracker.Returns(tracker);
            trackerProviderService.Enabled.Returns(true);

            controller = new CustomerProfileController(trackerProviderService, logger, customerProfileService);
        }

        [Fact]
        public void TrackLogIn_ShouldThrow_IfRequestNull()
        {
            // Act
            Action actual = () => controller.TrackLogIn(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void TrackLogIn_ShouldCallTrackLogIn_IfRequestNotNull()
        {
            // Act
            var actual = controller.TrackLogIn(new TrackCustomerLogInRequest()
            {
                FirstName = "firstname",
                LastName = "lastname",
                Title = "Mr"
            });

            // Assert
            actual.Should().BeOfType<HttpStatusCodeResult>();
            customerProfileService.Received().TrackLogIn(Arg.Any<TrackCustomerLogInRequest>());
        }
    }
}
