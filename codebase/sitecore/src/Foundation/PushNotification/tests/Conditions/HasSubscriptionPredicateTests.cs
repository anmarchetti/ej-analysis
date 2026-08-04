using AutoFixture.Xunit2;
using easyJet.Foundation.PushNotifications.Conditions;
using easyJet.Foundation.PushNotifications.Facets;
using FluentAssertions;
using NSubstitute;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.PushNotifications.Tests.Conditions
{
    public class HasSubscriptionPredicateTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly HasSubscriptionPredicate predicate;

        public HasSubscriptionPredicateTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new HasSubscriptionPredicate();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfNoSubscriptionsInFacet(Contact contact)
        {
            // Arrange
            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldNotSendPushNotification_IfSubscriptionsInFacet(Contact contact, PushSubscriptions pushSubscriptions)
        {
            // Arrange
            DeserializationHelpers.SetFacet(contact, "PushSubscriptions", pushSubscriptions);
            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
