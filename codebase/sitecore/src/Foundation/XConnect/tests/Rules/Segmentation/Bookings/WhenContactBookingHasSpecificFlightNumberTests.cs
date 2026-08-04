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
    public class WhenContactBookingHasSpecificFlightNumberTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly WhenContactBookingHasSpecificFlightNumber predicate;

        public WhenContactBookingHasSpecificFlightNumberTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new WhenContactBookingHasSpecificFlightNumber();
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
        public void Evaluate_ShouldBeFalse_IfBookingsIsEmpty(Contact contact, string flightNumber)
        {
            // Arrange
            predicate.FlightNumber = flightNumber;
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
        public void Evaluate_ShouldBeTrue_IfHasSpecificFlightNumber(Contact contact, string flightNumber)
        {
            // Arrange
            predicate.FlightNumber = flightNumber;

            var booking = new Booking()
            {
                Flights = new List<Flight>()
                {
                    new Flight()
                    {
                        Number = flightNumber
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
        public void Evaluate_ShouldBeFalse_IfHasNoSpecificFlightNumber(Contact contact)
        {
            // Arrange
            predicate.FlightNumber = "001";

            var booking = new Booking()
            {
                Flights = new List<Flight>()
                {
                    new Flight()
                    {
                        Number = "002"
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