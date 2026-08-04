using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using easyJet.Foundation.XConnect.Common.Rules.Segmentation.Bookings;
using FluentAssertions;
using NSubstitute;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Rules.Segmentation.Bookings
{
    public class WhenContactBookingHasFlightToSpecificLocationTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly WhenContactBookingHasFlightToSpecificLocation predicate;

        public WhenContactBookingHasFlightToSpecificLocationTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new WhenContactBookingHasFlightToSpecificLocation();
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
        public void Evaluate_ShouldBeFalse_IfBookingsIsEmpty(Contact contact, string location)
        {
            // Arrange
            predicate.Location = location;
            var facet = new BookingsFacet
            {
                Bookings = new Dictionary<string, Booking>()
            };

            DeserializationHelpers.SetFacet(contact, BookingsFacet.DefaultFacetKey, facet);

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeTrue_IfHasFlightToSpecificLocation(Contact contact, string location)
        {
            // Arrange
            predicate.Location = location;
            var booking = new Booking()
            {
                Flights = new List<Flight>()
                {
                    new Flight()
                    {
                        To = location
                    }
                }
            };

            var facet = new BookingsFacet
            {
                Bookings = new Dictionary<string, Booking>()
                {
                    { "001", booking }
                }
            };

            DeserializationHelpers.SetFacet(contact, BookingsFacet.DefaultFacetKey, facet);

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void Evaluate_ShouldBeFalse_IfHasNoFlightToSpecificLocation(Contact contact)
        {
            // Arrange
            predicate.Location = "Location 1";
            var booking = new Booking()
            {
                Flights = new List<Flight>()
                {
                    new Flight()
                    {
                        To = "Another Location"
                    }
                }
            };

            var facet = new BookingsFacet
            {
                Bookings = new Dictionary<string, Booking>()
                {
                    { "001", booking }
                }
            };

            DeserializationHelpers.SetFacet(contact, BookingsFacet.DefaultFacetKey, facet);

            ruleExecutionContext.Fact(Arg.Any<IFactIdentifier>()).Returns(contact);

            // Act
            var actual = predicate.Evaluate(ruleExecutionContext);

            // Assert
            actual.Should().BeFalse();
        }
    }
}