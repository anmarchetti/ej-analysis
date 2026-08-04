using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.PushNotifications.Activities;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.PushNotifications.Models.Domain;
using easyJet.Foundation.PushNotifications.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Sitecore.Xdb.MarketingAutomation.Core.Activity;
using Sitecore.Xdb.MarketingAutomation.Core.Processing.Plan;
using Xunit;

namespace easyJet.Foundation.PushNotifications.Tests.Activities
{
    public class PushNotificationTests
    {
        private readonly ILogger<PushNotification> logger;
        private readonly IPushNotificationService pushNotificationService;
        private readonly IUtmParamsService utmParamsService;
        private readonly PushNotification activity;
        private readonly IContactProcessingContext contactProcessingContext;

        public PushNotificationTests()
        {
            logger = Substitute.For<ILogger<PushNotification>>();
            pushNotificationService = Substitute.For<IPushNotificationService>();
            utmParamsService = Substitute.For<IUtmParamsService>();
            activity = new PushNotification(utmParamsService, pushNotificationService, logger);
            contactProcessingContext = Substitute.For<IContactProcessingContext>();
        }

        [Fact]
        public void Invoke_ShouldNotSendPushNotification_IfNoSubscriptionsInFacet()
        {
            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.DidNotReceive().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>());
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotification_IfSubscriptionsInFacet(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData, PushNotificationBooking booking)
        {
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);
            DeserializationHelpers.SetFacet(contact, "PushNotificationBooking", booking);

            contactProcessingContext.Contact.Returns(contact);

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>());
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotification_AllFacets(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData, PushNotificationBooking booking)
        {
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);
            DeserializationHelpers.SetFacet(contact, "PushNotificationBooking", booking);

            activity.Image = "{lastBookedHotel}";
            contactProcessingContext.Contact.Returns(contact);

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>());
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotification_NoBookingFacet(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData)
        {
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);

            activity.Image = "{lastBookedHotel}";

            contactProcessingContext.Contact.Returns(contact);

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>());
        }

        [Fact]
        public void Invoke_ShouldNotSendPushNotification_IfActitivyThrowException()
        {
            // Act
            var actual = activity.Invoke(null);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.DidNotReceive().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>());
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldLogError_IfPushNotificationThrowException(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData)
        {
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);

            contactProcessingContext.Contact.Returns(contact);

            pushNotificationService
                .When(x => x.SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Any<NotificationMessage>()))
                .Do(x => { throw new Exception(); });

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotificationWithEmptyCTA_IfCTAFieldIsNull(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);

            contactProcessingContext.Contact.Returns(contact);

            activity.CTA = string.Empty;

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Is<NotificationMessage>(x => x.Data.Url == string.Empty));
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotificationWithEmptyCTA_IfTrackingEndpointIsNull(Contact contact, PushSubscriptions pushSubscriptions)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            contactProcessingContext.Contact.Returns(contact);
            activity.CTA = "{lastVisitedHotel}";

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Is<NotificationMessage>(x => x.Data.Url == string.Empty));
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotificationWithCTAFromField_IfCtaFieldHasValue(Contact contact, PushSubscriptions pushSubscriptions)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            contactProcessingContext.Contact.Returns(contact);
            activity.CTA = "http://fake.com/";

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            utmParamsService.Received().SetUtmParams(Arg.Is<string>(x => x == "http://fake.com/"), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Invoke_ShouldSendPushNotificationWithCTAFromTrackingEndpoint_IfTrackingEndpointHasValue(Contact contact, PushSubscriptions pushSubscriptions, TrackingData trackingData)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            DeserializationHelpers.SetFacet(contact, "TrackingData", trackingData);
            contactProcessingContext.Contact.Returns(contact);
            activity.CTA = "{lastVisitedHotel}";

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            utmParamsService.Received().SetUtmParams(Arg.Is<string>(x => x == trackingData.Endpoint), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [InlineAutoData("{countryUrl}")]
        [InlineAutoData("{regionUrl}")]
        [InlineAutoData("{resortUrl}")]
        public void Invoke_ShouldSendPushNotificationWithTokenUrl_TokensAreNotEmpty(string token, Contact contact, PushSubscriptions pushSubscriptions)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            contactProcessingContext.Contact.Returns(contact);
            activity.CTA = token;
            utmParamsService.SetUtmParamsForTokenizedUrl(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(activity.CTA);

            // Act
            var actual = activity.Invoke(contactProcessingContext);

            // Assert
            actual.Should().BeOfType<SuccessMove>();
            pushNotificationService.Received().SendNotification(Arg.Any<List<Facets.PushSubscription>>(), Arg.Is<NotificationMessage>(x => x.Data.Url == activity.CTA));
        }
    }
}
