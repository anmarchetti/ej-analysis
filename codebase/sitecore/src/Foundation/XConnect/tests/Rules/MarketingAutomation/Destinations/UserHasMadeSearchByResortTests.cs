using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.XConnect.Common.Enums;
using easyJet.Foundation.XConnect.Common.Rules.MarketingAutomation.Destinations;
using FluentAssertions;
using NSubstitute;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Rules.MarketingAutomation.Destinations
{
    public class UserHasMadeSearchByResortTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly UserHasMadeSearchByResort predicate;

        public UserHasMadeSearchByResortTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new UserHasMadeSearchByResort();
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
            predicate.SearchDestination = "Resort";

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
            predicate.SearchDestination = "Resort";

            DeserializationHelpers.SetInteractions(contact, new List<Interaction>());

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeTrue_IfHasResortInSearches(Contact contact)
        {
            // Arrange
            var userSearch = new UserSearches();
            userSearch.Searches.Add(new UserSearch()
            {
                Destinations = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Resort", Type = DestinationType.Resort.ToString() }
                }
            });

            predicate.SearchDestination = "Resort";

            var interactions = new Interaction(contact, InteractionInitiator.Contact, Guid.NewGuid(), "useragent");
            DeserializationHelpers.SetFacet(interactions, UserSearches.DefaultFacetKey, userSearch);
            DeserializationHelpers.SetInteractions(contact, new List<Interaction>() { interactions });

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfHasNoResortInSearches(Contact contact)
        {
            // Arrange
            var userSearch = new UserSearches();
            userSearch.Searches.Add(new UserSearch()
            {
                Destinations = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Resort", Type = DestinationType.Country.ToString() }
                }
            });

            predicate.SearchDestination = "Majorca";

            var interactions = new Interaction(contact, InteractionInitiator.Contact, Guid.NewGuid(), "useragent");
            DeserializationHelpers.SetFacet(interactions, UserSearches.DefaultFacetKey, userSearch);
            DeserializationHelpers.SetInteractions(contact, new List<Interaction>() { interactions });

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }
    }
}