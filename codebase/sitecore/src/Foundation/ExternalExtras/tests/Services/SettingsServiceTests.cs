using AutoFixture.Xunit2;
using easyJet.Foundation.ExternalExtras.Models;
using easyJet.Foundation.ExternalExtras.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.ExternalExtras.Tests.Services
{
    public class SettingsServiceTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly SettingsService sut;
        private readonly IItemsContextProvider itemsContextProvider;

        public SettingsServiceTests()
        {
            var baseSettings = Substitute.For<BaseSettings>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            itemsContextProvider = Substitute.For<IItemsContextProvider>();
            sut = new SettingsService(baseSettings, databaseProvider, itemsContextProvider);
        }

        [Fact]
        public void GetSettings_ShouldReturnDefault_IfSettingsItemNotFound()
        {
            // Arrange
            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsNull();

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.IsPublic.Should().BeFalse();
        }

        [Fact]
        public void GetSettings_ShouldReturnSettings()
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings()
                .WithField(Constants.FieldNames.IsEnabled, "0")
                .WithField(Multisite.Constants.Fields.BaseSetting.IsPublic, "0");

            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsForAnyArgs(item);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.IsPublic.Should().BeFalse();
        }

        [Fact]
        public void GetSettings_ShouldReturnCachedSettings()
        {
            // Arrange
            var entry = new ExternalExtrasSettings
            {
                IsEnabled = false,
                IsPublic = false,
            };

            itemsContextProvider.GetItem<ExternalExtrasSettings>(nameof(SettingsService)).Returns(entry);
            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.IsPublic.Should().BeFalse();
        }
    }
}