using System;
using easyJet.Foundation.XConnect.Common.PurgeConditions;
using FluentAssertions;
using Sitecore.XConnect;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.PurgeConditions
{
    public class AnonymousWithoutPushNotificationsConditionTests
    {
        private const string PushNotificationsSource = "PushNotifications";
        private readonly AnonymousWithoutPushNotificationsCondition condition = new AnonymousWithoutPushNotificationsCondition();

        [Fact]
        public void CheckContact_UserIsKnown_HasSubscriptionIdentifier()
        {
            var testContact = new Contact(new[]
            {
                new ContactIdentifier(PushNotificationsSource, Guid.NewGuid().ToString(), ContactIdentifierType.Known)
            });
            var result = condition.IsAccepted(testContact);

            result.Should().BeFalse();
        }

        [Fact]
        public void CheckContact_UserIsKnown_DoesntHaveSubscriptionIdentifier()
        {
            var testContact = new Contact(new[]
            {
                new ContactIdentifier("test", Guid.NewGuid().ToString(), ContactIdentifierType.Known)
            });
            var result = condition.IsAccepted(testContact);

            result.Should().BeFalse();
        }

        [Fact]
        public void CheckContact_UserIsAnonymous_DoesntHaveSubscriptionIdentifier()
        {
            var testContact = new Contact(new[]
            {
                new ContactIdentifier("test", Guid.NewGuid().ToString(), ContactIdentifierType.Anonymous)
            });
            var result = condition.IsAccepted(testContact);

            result.Should().BeTrue();
        }

        [Fact]
        public void CheckContact_UserIsAnonymous_HasSubscriptionIdentifier()
        {
            var testContact = new Contact(new[]
            {
                new ContactIdentifier(PushNotificationsSource, Guid.NewGuid().ToString(), ContactIdentifierType.Anonymous)
            });
            var result = condition.IsAccepted(testContact);

            result.Should().BeFalse();
        }
    }
}