using System;
using easyJet.Feature.PushNotifications.Exceptions;
using easyJet.Feature.PushNotifications.Logging;
using easyJet.Feature.PushNotifications.Services;
using easyJet.Foundation.Analytics.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Feature.PushNotifications.Tests.Services
{
    public class ListSubscriptionServiceTests
    {
        private readonly IXdbContext client;
        private readonly IPushNotificationsLogger logger;
        private readonly IContactService contactService;

        public ListSubscriptionServiceTests()
        {
            client = Substitute.For<IXdbContext>();
            logger = Substitute.For<IPushNotificationsLogger>();
            contactService = Substitute.For<IContactService>();
        }

        [Fact]
        public void Unsubscribe_ShouldUnsubscribe_IfSubscriptionExists()
        {
            // Arrange
            var id = Guid.NewGuid();

            var contact = GetContact(id);

            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).Returns(contact);

            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", id.ToString()))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            service.Unsubscribe(id);

            // Assert
            client.Received().SubmitAsync();
            contact.ListSubscriptions().Subscriptions.Count.Should().Be(0);
        }

        [Fact]
        public void Unsubscribe_ShouldSkipUnsubscribing_IfSubscriptionDoesNotExist()
        {
            // Arrange
            var id = Guid.NewGuid();

            var contact = new Contact(new ContactIdentifier("new", id.ToString(), ContactIdentifierType.Known));

            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).Returns(contact);
            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", id.ToString()))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            service.Unsubscribe(id);

            // Assert
            Assert.Null(contact.ListSubscriptions());
        }

        [Fact]
        public void Unsubscribe_ShouldSkipUnsubscribing_IfSubscriptionDoesNotExistWithId()
        {
            // Arrange
            var id = Guid.NewGuid();
            var contact = GetContact(id);

            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).Returns(contact);

            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", Guid.NewGuid().ToString()))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            service.Unsubscribe(id);

            // Assert
            client.DidNotReceive().SubmitAsync();
            contact.ListSubscriptions()?.Subscriptions.Count.Should().Be(1);
        }

        [Fact]
        public void Unsubscribe_ShouldCatchException_IfClientThrowException()
        {
            // Arrange
            var id = Guid.NewGuid();

            var contact = new Contact(new ContactIdentifier("new", id.ToString(), ContactIdentifierType.Known));

            client.When(x => x.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()))
                .Do(x => { throw new ListSubscriptionException("error"); });

            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", id.ToString()))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            Action action = () => { service.Unsubscribe(id); };

            // Assert
            action.Should().Throw<ListSubscriptionException>();
        }

        [Fact]
        public void Unsubscribe_ShouldUnsubscribe_IfSubscriptionsExist()
        {
            // Arrange
            var id = Guid.NewGuid();

            var contact = GetContact(id);

            client.GetAsync(Arg.Any<ContactReference>(), Arg.Any<ContactExecutionOptions>()).Returns(contact);

            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", id.ToString()))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            service.Unsubscribe(new Guid[] { id });

            // Assert
            client.Received().SubmitAsync();
            contact.ListSubscriptions().Subscriptions.Count.Should().Be(0);
        }

        [Fact]
        public void Unsubscribe_ShouldDoNotUnsubscribe_IfSubscriptionsListIsEmpty()
        {
            // Arrange
            var id = Guid.NewGuid();

            ListSubscriptionService service;

            using (new SettingsSwitcher("easyJet.Feature.PushNotifications.UnsubscriptionList", string.Empty))
            {
                service = Substitute.ForPartsOf<ListSubscriptionService>(contactService, logger);
                service.When(x => x.GetClient()).DoNotCallBase();
                service.GetClient().Returns(client);
            }

            // Act
            service.Unsubscribe(id);

            // Assert
            logger.Warn($"Can not unsubscribe contact {id} due to UnsubscriptionListIds is null or empty.", Arg.Any<object>());
        }

        private Contact GetContact(Guid id)
        {
            var contact = new Contact(new ContactIdentifier("new", id.ToString(), ContactIdentifierType.Known));

            var listSubscriptions = new ListSubscriptions();
            listSubscriptions.Subscriptions.Add(new ContactListSubscription(DateTime.Now, true, id));
            DeserializationHelpers.SetFacet(contact, "ListSubscriptions", listSubscriptions);

            return contact;
        }
    }
}
