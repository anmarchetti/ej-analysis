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
    public class WhenContactBookingHasSpecificNumberOfChildrenTests
    {
        private readonly IRuleExecutionContext ruleExecutionContext;
        private readonly WhenContactBookingHasSpecificNumberOfChildren predicate;

        public WhenContactBookingHasSpecificNumberOfChildrenTests()
        {
            ruleExecutionContext = Substitute.For<IRuleExecutionContext>();
            predicate = new WhenContactBookingHasSpecificNumberOfChildren();
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
        public void Evaluate_ShouldBeFalse_IfBookingsIsEmpty(Contact contact, int numberChildren)
        {
            // Arrange
            predicate.NumberOfChildren = numberChildren;
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
        public void Evaluate_ShouldBeTrue_IfHasSpecificNumberOfChildren(Contact contact, int numberChildren)
        {
            // Arrange
            predicate.NumberOfChildren = numberChildren;
            predicate.Comparison = Sitecore.XConnect.Segmentation.Predicates.NumericOperationType.IsEqualTo;

            var booking = new Booking()
            {
                ChildrenCount = numberChildren,
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
        public void Evaluate_ShouldBeFalse_IfHasNoSpecificNumberOfChildren(Contact contact)
        {
            // Arrange
            predicate.NumberOfChildren = 1;
            predicate.Comparison = Sitecore.XConnect.Segmentation.Predicates.NumericOperationType.IsEqualTo;

            var booking = new Booking()
            {
                ChildrenCount = 2
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