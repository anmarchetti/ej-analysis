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
using Sitecore.XConnect.Segmentation.Predicates;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Rules.MarketingAutomation.Destinations
{
    public class UserHasMadeSearchFromDepartureAirportsTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly UserHasMadeSearchFromDepartureAirports predicate;
        private readonly IContactSearchQueryContext queryContext;

        public UserHasMadeSearchFromDepartureAirportsTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new UserHasMadeSearchFromDepartureAirports();
            queryContext = Substitute.For<IContactSearchQueryContext>();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfNoFacet(Contact contact)
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
            predicate.DepartureAirports = "SPA";

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
            predicate.DepartureAirports = "SPA";

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
                Airports = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Spain", Type = DestinationType.Region.ToString(), Code = "SPA" },
                },
                Destinations = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Spain", Type = DestinationType.Country.ToString() }
                }
            });

            predicate.DepartureAirports = "Spa";

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
                Airports = new List<TrackingItem>()
                {
                    new TrackingItem() { Name = "Spain", Type = DestinationType.Region.ToString(), Code = "SPA" },
                },
            });

            predicate.DepartureAirports = "GVA";

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