using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using easyJet.Foundation.XConnect.Common.Rules.Segmentation.Bookings;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Framework.Rules;
using Sitecore.XConnect;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Rules.Segmentation.Bookings
{
    public class WhenContactBookingHasSpecificReservationIdTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly WhenContactBookingHasSpecificReservationId predicate;

        public WhenContactBookingHasSpecificReservationIdTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new WhenContactBookingHasSpecificReservationId();
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
        public void Evaluate_ShouldBeFalse_IfBookingsIsEmpty(Contact contact, string id)
        {
            // Arrange
            predicate.ReservationId = id;
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
        public void Evaluate_ShouldBeTrue_IfHasSpecificReservationId(Contact contact, string id)
        {
            // Arrange
            predicate.ReservationId = id;

            var booking = new Booking()
            {
                ReservationId = id,
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
        public void Evaluate_ShouldBeFalse_IfHasNoSpecificReservationId(Contact contact)
        {
            // Arrange
            predicate.ReservationId = "1-id";

            var booking = new Booking()
            {
                ReservationId = "2-id"
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