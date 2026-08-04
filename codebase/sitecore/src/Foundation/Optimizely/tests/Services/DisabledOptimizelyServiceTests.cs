using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Services
{
    public class DisabledOptimizelyServiceTests
    {
        [Fact]
        public void Decide_ShouldReturnDisabledResult()
        {
            var sut = new DisabledOptimizelyService();

            var result = sut.Decide("flag-a");

            result.Enabled.Should().BeFalse();
            result.Variation.Should().BeNull();
            result.Variables.Should().BeEmpty();
        }

        [Fact]
        public void DecideWithSource_ShouldReturnDisabledResult()
        {
            var sut = new DisabledOptimizelyService();

            var result = sut.Decide("flag-a", OptimizelyDecisionSource.ComponentPersonalization);

            result.Enabled.Should().BeFalse();
            result.Variation.Should().BeNull();
            result.Variables.Should().BeEmpty();
        }

        [Fact]
        public void DecideForKeys_ShouldReturnEmptyResult()
        {
            var sut = new DisabledOptimizelyService();

            var result = sut.Decide(new[] { "flag-a", "flag-b" });

            result.Should().BeEmpty();
        }
    }
}
