using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class IntegrationStrategyFactoryTests
    {
        private readonly IntegrationStrategyFactory factory;

        public IntegrationStrategyFactoryTests()
        {
            factory = new IntegrationStrategyFactory();
        }

        [Fact]
        public void GetIntegrationStrategy_ShouldReturnHotelBedsStrategy_IfChanelTypeIsHotelBeds()
        {
            // Act
            var actual = factory.GetIntegrationStrategy(ChanelTypes.HotelBeds);

            // Assert
            actual.Should().BeOfType<HotelBeds>();
        }

        [Fact]
        public void GetIntegrationStrategy_ShouldReturnDirectlyContractedStrategy_IfChanelTypeIsDirectlyContracted()
        {
            // Act
            var actual = factory.GetIntegrationStrategy(ChanelTypes.DirectlyContracted);

            // Assert
            actual.Should().BeOfType<DirectlyContacted>();
        }

        [Fact]
        public void GetIntegrationStrategy_ShouldReturnExpediaStrategy_IfChanelTypeIsExpedia()
        {
            // Act
            var actual = factory.GetIntegrationStrategy(ChanelTypes.Expedia);

            // Assert
            actual.Should().BeOfType<Expedia>();
        }

        [Theory]
        [InlineData("W0047898")]
        [InlineData("W0099906")]
        [InlineData("W1332500")]
        public void GetIntegrationStrategy_ShouldReturnExpediaStrategy_IfAtcomCodeIsExpedia(string atcomCode)
        {
            // Act
            var actual = factory.GetIntegrationStrategy(atcomCode);

            // Assert
            actual.Should().BeOfType<Expedia>();
        }
    }
}
