using System;
using System.Collections.Generic;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Feature.PushNotifications.Controllers;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Feature.PushNotifications.Models.Requests;
using easyJet.Feature.PushNotifications.Services;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.PushNotifications.Facets;
using FluentAssertions;
using NSubstitute;
using Sitecore.Analytics;
using Sitecore.Analytics.Tracking;
using Xunit;

namespace easyJet.Feature.PushNotifications.Tests.Controllers
{
    public class PushNotificationsControllerTests
    {
        private readonly IPushNotificationsLogger logger;
        private readonly IPushSubscriptionService pushSubscriptionService;
        private readonly IListSubscriptionService listSubscriptionService;
        private readonly ITrackerProvider trackerProviderService;
        private readonly ITracker tracker;

        private readonly PushNotificationsController controller;

        public PushNotificationsControllerTests()
        {
            pushSubscriptionService = Substitute.For<IPushSubscriptionService>();
            logger = Substitute.For<IPushNotificationsLogger>();
            listSubscriptionService = Substitute.For<IListSubscriptionService>();
            tracker = Substitute.For<ITracker>();
            tracker.IsActive.Returns(true);
            tracker.Contact.Returns(Substitute.For<Contact>());
            tracker.Interaction.Returns(Substitute.For<CurrentInteraction>());

            trackerProviderService = Substitute.For<ITrackerProvider>();
            trackerProviderService.CurrentTracker.Returns(tracker);
            trackerProviderService.Enabled.Returns(true);

            controller = new PushNotificationsController(trackerProviderService, pushSubscriptionService, listSubscriptionService, logger);
        }

        [Fact]
        public void Subscribe_ShouldThrowException_IfSubsctiptionIsNull()
        {
            // Actual
            Action actual = () => controller.Subscribe(new SubscriptionRequest()
            {
                Subscription = null
            });

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Subscribe_ShouldSaveSubscription_IfSubscriptionHaveValue()
        {
            // Actual
            controller.Subscribe(new SubscriptionRequest()
            {
                Subscription = new Models.Domain.PushSubscription()
                {
                    Endpoint = "endpoint",
                    Keys = new Dictionary<string, string>()
                        {
                            { "Key", "Value" }
                        }
                }
            });

            // Assert
            pushSubscriptionService.Received().Update(Arg.Any<Guid>(), Arg.Any<PushSubscription>());
        }

        [Theory]
        [AutoData]
        public void Subscribe_ShouldSaveSubscriptionToken_IfSubscriptionRequestHasToken(string token)
        {
            // Act
            controller.Subscribe(new SubscriptionRequest()
            {
                Subscription = new Models.Domain.PushSubscription()
                {
                    Token = token
                }
            });

            // Assert
            pushSubscriptionService.Received().Update(Arg.Any<Guid>(), Arg.Is<PushSubscription>(x => x.Token == token));
        }

        [Fact]
        public void Unsubscribe_ShouldThrowException_IfSubscriptionIsNull()
        {
            // Act
            Action actual = () => controller.Unsubscribe(new UnsubscriptionRequest()
            {
                Subscription = null
            });

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoData]
        public void Unsubscribe_ShouldGetContactIdFromRequest_IfContactIdIsGuid(Guid contactId)
        {
            // Act
            var actual = controller.Unsubscribe(new UnsubscriptionRequest()
            {
                ContactId = contactId.ToString(),
                Subscription = new Models.Domain.PushSubscription()
                {
                    Endpoint = "endpoint",
                    Keys = new Dictionary<string, string>()
                    {
                        { "Key", "Value" }
                    }
                }
            });

            // Assert
            actual.Should().BeOfType<HttpStatusCodeResult>();
            pushSubscriptionService.Received().Remove(Arg.Is<Guid>(x => x == contactId), Arg.Any<PushSubscription>());
            listSubscriptionService.Received().Unsubscribe(Arg.Is<Guid>(x => x == contactId));
        }

        [Fact]
        public void SafariUnsubscribe_ShouldThrowException_IfTokenIsNull()
        {
            // Act
            Action actual = () => controller.SafariUnsubscribe(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [AutoData]
        public void SafariUnsubscribe_ShouldReturnNotFound_IfNotFoundContactByToken(string token)
        {
            // Arragne
            var searchResult = new Dictionary<Guid, PushSubscription>();
            pushSubscriptionService.Search(Arg.Any<string>()).Returns(searchResult);

            // Act
            var actual = controller.SafariUnsubscribe(token);

            // Assert
            actual.Should().BeOfType<HttpNotFoundResult>();
        }

        [Theory]
        [AutoData]
        public void SafariUnsubscribe_ShouldUnsubscribedFromPushNotification_IfSearchFoundContactByToken(string token, Dictionary<Guid, PushSubscription> searchResult)
        {
            // Arragne
            pushSubscriptionService.Search(Arg.Any<string>()).Returns(searchResult);

            // Act
            var actual = controller.SafariUnsubscribe(token);

            // Assert
            actual.Should().BeOfType<HttpStatusCodeResult>();
            pushSubscriptionService.Received().Remove(Arg.Any<Dictionary<Guid, PushSubscription>>());
            listSubscriptionService.Received().Unsubscribe(Arg.Any<IEnumerable<Guid>>());
        }
    }
}
