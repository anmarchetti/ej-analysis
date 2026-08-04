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
    public class WhenContactBookingWasMadeInPeriodTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly WhenContactBookingWasMadeInPeriod predicate;

        public WhenContactBookingWasMadeInPeriodTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new WhenContactBookingWasMadeInPeriod();
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
        public void Evaluate_ShouldBeFalse_IfBookingsIsEmpty(Contact contact)
        {
            // Arrange
            predicate.StartOfPeriod = new DateTime(2024, 2, 10);
            predicate.EndOfPeriod = new DateTime(2024, 2, 15);
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
        public void Evaluate_ShouldBeTrue_IfBookingWasMadeInPeriod(Contact contact)
        {
            // Arrange
            predicate.StartOfPeriod = new DateTime(2024, 2, 10);
            predicate.EndOfPeriod = new DateTime(2024, 2, 15);
            var booking = new Booking()
            {
                CreatedDate = new DateTime(2024, 2, 13)
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
        public void Evaluate_ShouldBeFalse_IfBookingWasNotMadeInPeriod(Contact contact)
        {
            // Arrange
            predicate.StartOfPeriod = new DateTime(2024, 2, 10);
            predicate.EndOfPeriod = new DateTime(2024, 2, 15);
            var booking = new Booking()
            {
                CreatedDate = new DateTime(2024, 3, 13)
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