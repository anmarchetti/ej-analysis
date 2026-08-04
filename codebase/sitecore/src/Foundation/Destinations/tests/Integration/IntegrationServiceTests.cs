using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Integration.Strategies;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Integration
{
    public class IntegrationServiceTests
    {
        private readonly IIntegrationStrategyFactory factory;
        private readonly IntegrationService service;

        public IntegrationServiceTests()
        {
            factory = Substitute.For<IIntegrationStrategyFactory>();
            service = new IntegrationService(factory);
        }

        [Theory]
        [AutoData]
        public void FormatNameWithAbbv_ShouldFormatName_IfStrategyIsSetByCode(string code, string name, string formattedName)
        {
            // Arrange
            var strategy = Substitute.For<IIntegrationStrategy>();
            strategy.FormatNameWithAbbv(Arg.Any<string>()).Returns(formattedName);
            factory.GetIntegrationStrategy(Arg.Any<string>()).Returns(strategy);

            // Act
            var actual = service.SetIntegrationStrategy(code).FormatNameWithAbbv(name);

            // Assert
            actual.Should().Be(formattedName);
        }

        [Theory]
        [AutoData]
        public void FormatNameWithAbbv_ShouldFormatName_IfIntergationStratageIsSetByChannelType(ChanelTypes type, string name, string formattedName)
        {
            // Arrange
            var strategy = Substitute.For<IIntegrationStrategy>();
            strategy.FormatNameWithAbbv(Arg.Any<string>()).Returns(formattedName);
            factory.GetIntegrationStrategy(Arg.Any<ChanelTypes>()).Returns(strategy);

            // Act
            var actual = service.SetIntegrationStrategy(type).FormatNameWithAbbv(name);

            // Assert
            actual.Should().Be(formattedName);
        }

        [Theory]
        [AutoData]
        public void ExtractCode_ShouldReturnCode_IfIfCodeMatchStrategy(string code, string[] sourceCodes, string extractedCode)
        {
            // Arrange
            var strategy = Substitute.For<IIntegrationStrategy>();
            strategy.CheckIfCodeMatchStrategy(Arg.Any<string>(), out Arg.Any<string>())
                .Returns(x =>
                {
                    x[1] = extractedCode;
                    return true;
                });
            factory.GetIntegrationStrategy(Arg.Any<string>()).Returns(strategy);

            // Act
            var actual = service.SetIntegrationStrategy(code).ExtractCode(sourceCodes);

            // Assert
            actual.Should().Be(extractedCode);
        }

        [Theory]
        [AutoData]
        public void ExtractCode_ShouldReturnNull_IfIfCodeDoesNotMatchStrategy(string code, string[] sourceCodes)
        {
            // Arrange
            var strategy = Substitute.For<IIntegrationStrategy>();
            strategy.CheckIfCodeMatchStrategy(Arg.Any<string>(), out Arg.Any<string>())
                .Returns(x =>
                {
                    x[1] = null;
                    return false;
                });
            factory.GetIntegrationStrategy(Arg.Any<string>()).Returns(strategy);

            // Act
            var actual = service.SetIntegrationStrategy(code).ExtractCode(sourceCodes);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void ValidateCode_ShouldReturnTrue_IfIfCodeMatchStrategy(ChanelTypes type, string atcomCode)
        {
            // Arrange
            var strategy = Substitute.For<IIntegrationStrategy>();
            strategy.CheckIfCodeMatchStrategy(Arg.Any<string>(), out Arg.Any<string>())
                .Returns(true);
            factory.GetIntegrationStrategy(Arg.Any<ChanelTypes>()).Returns(strategy);

            // Act
            var actual = service.SetIntegrationStrategy(type).ValidateCode(atcomCode);

            // Assert
            actual.Should().BeTrue();
        }
    }
}
