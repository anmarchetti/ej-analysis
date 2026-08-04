using System;
using AutoFixture.Xunit2;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Feature.PushNotifications.Services;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.PushNotifications.Facets;
using FluentAssertions;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Operations;
using Xunit;

namespace easyJet.Feature.PushNotifications.Tests.Services
{
    public class PushSubscriptionServiceTests
    {
        private readonly IContactService contactService;
        private readonly IPushNotificationsLogger logger;
        private readonly PushSubscriptionService service;

        public PushSubscriptionServiceTests()
        {
            contactService = Substitute.For<IContactService>();
            logger = Substitute.For<IPushNotificationsLogger>();
            service = Substitute.ForPartsOf<PushSubscriptionService>(contactService, logger);
        }

        [Theory]
        [AutoData]
        public void Remove_ShouldNotRemovedPushSubscription_IfContactHasNoFacet(Contact contact, Guid contactId, PushSubscription pushSubscription)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            service
                .When(x => x.GetContactById(Arg.Any<IXdbContext>(), Arg.Any<string>(), Arg.Any<Guid>()))
                .DoNotCallBase();

            service
                .GetContactById(Arg.Any<IXdbContext>(), Arg.Any<string>(), Arg.Any<Guid>())
                .Returns(contact);

            service.When(x => x.GetClient()).DoNotCallBase();
            service.GetClient().Returns(client);

            // Act
            service.Remove(contactId, pushSubscription);

            // Assert
            client.DidNotReceive().RegisterOperation(Arg.Any<SetFacetOperation>());
        }

        [Fact]
        public void Update_ShouldNotUpdateFacet_IfContactIsNull()
        {
            // Arrange
            var id = Guid.NewGuid();
            Contact contact = null;
            service.When(x => x.GetClient()).DoNotCallBase();

            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string>()).Returns(contact);

            // Act
            service.Update(id, null);

            // Assert
            service.DidNotReceive().SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<PushSubscriptions>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Update_ShouldUpdateFacet_IfContactIsExist(Guid id, Contact contact, PushSubscription subscription)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            service.When(x => x.GetClient()).DoNotCallBase();
            service.When(x => x.SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<PushSubscriptions>(), Arg.Any<string>())).DoNotCallBase();
            service.GetClient().Returns(client);
            service.GetCurrentTrackerContact(Arg.Any<IXdbContext>(), Arg.Any<string>()).Returns(contact);

            // Act
            service.Update(id, subscription);

            // Assert
            service.Received().SetContactFacet(Arg.Any<IXdbContext>(), Arg.Any<Contact>(), Arg.Any<PushSubscriptions>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void Update_ShouldCatchError_IfXConnectThrowsError(Guid id)
        {
            // Act
            service.When(x => x.GetClient()).Do(x => { throw new XdbExecutionException(); });

            service.Update(id, null);

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Search_ShouldThrowsError_IfXdbThrowsError(string token)
        {
            // Arrange
            service.When(x => x.GetClient()).Do(x => { throw new XdbExecutionException(); });

            // Act
            var actual = service.Search(token);

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            actual.Count.Should().Be(0);
        }
    }
}
