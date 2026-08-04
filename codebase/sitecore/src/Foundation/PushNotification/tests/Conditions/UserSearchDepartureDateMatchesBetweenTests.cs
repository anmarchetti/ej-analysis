using System;
using System.Collections.Generic;
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
    public class UserSearchDepartureDateMatchesBetweenTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly UserSearchDepartureDateMatchesBetween predicate;

        public UserSearchDepartureDateMatchesBetweenTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new UserSearchDepartureDateMatchesBetween();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfMinAndMaxDateArgumentsIsNotValid(Contact contact)
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
        public void Evaluate_ShouldBeFalse_IfNoInteractions(Contact contact)
        {
            // Arrange
            predicate.MinDate = "20220201T000000Z";
            predicate.MaxDate = "20220228T000000Z";

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfInteractionsIsEmpty(Contact contact)
        {
            // Arrange
            predicate.MinDate = "20220201T000000Z";
            predicate.MaxDate = "20220228T000000Z";

            DeserializationHelpers.SetInteractions(contact, new List<Interaction>());

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeTrue_IfDepartureDateIsBetweenMinAndMaxDate(Contact contact)
        {
            // Arrange
            var userSearch = new UserSearches();
            userSearch.Searches.Add(new UserSearch() { StartDate = new DateTime(2022, 02, 06) });

            predicate.MinDate = "20220201T000000Z";
            predicate.MaxDate = "20220228T000000Z";

            var interactions = new Interaction(contact, InteractionInitiator.Contact, Guid.NewGuid(), "useragent");
            DeserializationHelpers.SetFacet(interactions, UserSearches.DefaultFacetKey, userSearch);
            DeserializationHelpers.SetInteractions(contact, new List<Interaction>() { interactions });

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
