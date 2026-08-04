using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class EnvironmentHintSettingsServiceTests
    {
        private readonly BaseSettings settings;
        private readonly EnvironmentHintSettingsService sut;

        public EnvironmentHintSettingsServiceTests()
        {
            settings = Substitute.For<BaseSettings>();
            sut = new EnvironmentHintSettingsService(settings);
        }

        [Theory]
        [AutoData]
        public void FontColor_ShouldReturn_FontColor(string expected)
        {
            // Arrange
            settings.GetSetting(Constants.EnvironmentHint.EnvironmentHintFontColorSettingsName).Returns(expected);

            // Act
            var actual = sut.FontColor;

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [AutoData]
        public void BackgroundColor_ShouldReturn_BackgroundColor(string expected)
        {
            // Arrange
            settings.GetSetting(Constants.EnvironmentHint.EnvironmentHintBackgroundColorSettingsName).Returns(expected);

            // Act
            var actual = sut.BackgroundColor;

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [AutoData]
        public void Paths_ShouldReturn_Paths(string expected)
        {
            // Arrange
            settings.GetSetting(Constants.EnvironmentHint.EnvironmentHintPathsSettingsName).Returns(expected);

            // Act
            var actual = sut.Paths;

            // Assert
            actual.Should().Be(expected);
        }

        [Theory]
        [AutoData]
        public void EnvironmentName_ShouldReturn_EnvironmentName(string expected)
        {
            // Arrange
            settings.GetSetting(Constants.EnvironmentHint.EnvironmentHintEnvironmentNameSettingsName).Returns(expected);

            // Act
            var actual = sut.EnvironmentName;

            // Assert
            actual.Should().Be(expected);
        }
    }
}