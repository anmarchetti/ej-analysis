using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.PushNotifications.Models.Domain;
using easyJet.Foundation.PushNotifications.Services;
using FluentAssertions.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using Xunit;
using PushSubscription = easyJet.Foundation.PushNotifications.Facets.PushSubscription;

namespace easyJet.Foundation.PushNotifications.Tests.Services
{
    public class PushNotificationServiceTest
    {
        private readonly IPushNotificationService notificationService;
        private readonly ILogger<PushNotificationService> logger;

        public PushNotificationServiceTest()
        {
            var configuration = Substitute.For<IConfiguration>();
            logger = Substitute.For<ILogger<PushNotificationService>>();
            notificationService = new PushNotificationService(configuration, logger);
        }

        [Fact]
        public void PushNotification_LogCount_ShouldBeTwo()
        {
            // Arrange
            var notificationMessage = new NotificationMessage
            {
                Body = "body",
                Data = new NotificationMessageData(),
                Icon = "icon",
                Image = "image",
                Title = "title"
            };
            var pushSubscription = new PushSubscription
            {
                Endpoint = "test",
                Keys = new Dictionary<string, string> { { "key", "value" } },
                Token = "token",
                XObject = { }
            };
            var subscriptions = new List<PushSubscription>
            {
                pushSubscription
            };

            // Act
            notificationService.SendNotification(subscriptions, notificationMessage);

            // Assert
            logger.ReceivedCalls().Count().IsSameOrEqualTo(2);
        }
    }
}