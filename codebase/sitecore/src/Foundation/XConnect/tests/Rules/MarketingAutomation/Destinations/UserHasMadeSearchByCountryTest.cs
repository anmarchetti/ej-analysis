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
    public class UserHasMadeSearchByCountryTest
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly UserHasMadeSearchByCountry predicate;

        public UserHasMadeSearchByCountryTest()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new UserHasMadeSearchByCountry();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfNoInteractions(Contact contact)
        {
            // Arrange
            predicate.SearchDestination = "Spain";

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
            predicate.SearchDestination = "Spain";

            DeserializationHelpers.SetInteractions(contact, new List<Interaction>());

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeTrue_IfHasCountryInSearches(Contact contact)
        {
            // Arrange
            var userSearch = new UserSearches();
            userSearch.Searches.Add(new UserSearch()
            {
                Destinations = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Spain", Type = DestinationType.Country.ToString() }
                }
            });

            predicate.SearchDestination = "Spain";

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
        public void Evaluate_ShouldBeFalse_IfHasNoCountryInSearches(Contact contact)
        {
            // Arrange
            var userSearch = new UserSearches();
            userSearch.Searches.Add(new UserSearch()
            {
                Destinations = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Spain", Type = DestinationType.Region.ToString() }
                }
            });

            predicate.SearchDestination = "Spain";

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