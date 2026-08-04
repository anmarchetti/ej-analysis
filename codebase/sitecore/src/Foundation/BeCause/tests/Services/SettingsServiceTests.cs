using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services
{
    public class SettingsServiceTests
    {
        private readonly BaseSettings baseSettings;
        private readonly IDatabaseProvider databaseProvider;
        private readonly SettingsService sut;

        public SettingsServiceTests()
        {
            baseSettings = Substitute.For<BaseSettings>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sut = new SettingsService(baseSettings, databaseProvider, false);
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
            settings.Endpoint.Should().BeNullOrEmpty();
            settings.CustomIdentifierId.Should().BeNullOrEmpty();
            settings.Certificates.Should().BeNullOrEmpty();
            settings.SelectedResultFieldNames.Should().BeNullOrEmpty();
            settings.CertificationTags.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void GetSettings_ShouldReturnSettings(string certificate, string certificate2, string fieldName, string fieldName2)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings()
                .WithField(Constants.FieldNames.Certificates, $"{certificate}\r\n{certificate2}")
                .WithField(Constants.FieldNames.SelectedResultFieldNames, $"{fieldName}{Environment.NewLine}{fieldName2}")
                .WithField(Constants.FieldNames.IsEnabled, "1");

            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsForAnyArgs(item);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.Endpoint.Should().BeNullOrEmpty();
            settings.CustomIdentifierId.Should().BeNullOrEmpty();
            settings.CertificationTags.Should().BeNullOrEmpty();
            settings.Certificates.Should().NotBeNullOrEmpty();
            settings.Certificates.Should().Contain(certificate);
            settings.Certificates.Should().Contain(certificate2);
            settings.SelectedResultFieldNames.Should().NotBeNullOrEmpty();
            settings.SelectedResultFieldNames.Should().Contain(fieldName);
            settings.SelectedResultFieldNames.Should().Contain(fieldName2);
        }

        [Theory]
        [AutoData]
        public void GetSettings_ShouldReturnSettings2(string certificate, string certificate2, string fieldName, string fieldName2, string endpoint, string customIdentifierId, string certificationTags)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings()
                .WithField(Constants.FieldNames.Certificates, $"{certificate}\r\n{certificate2}")
                .WithField(Constants.FieldNames.SelectedResultFieldNames, $"{fieldName}{Environment.NewLine}{fieldName2}")
                .WithField(Constants.FieldNames.IsEnabled, "1");

            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsForAnyArgs(item);
            baseSettings.GetSetting(Constants.EndpointSettingName).Returns(endpoint);
            baseSettings.GetSetting(Constants.CustomIdentifierIdSettingsName).Returns(customIdentifierId);
            baseSettings.GetSetting(Constants.CertificationTagsSettingsName).Returns(certificationTags);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.Endpoint.Should().NotBeNullOrEmpty();
            settings.Endpoint.Should().Be(endpoint);
            settings.CustomIdentifierId.Should().NotBeNullOrEmpty();
            settings.CustomIdentifierId.Should().Be(customIdentifierId);
            settings.Certificates.Should().NotBeNullOrEmpty();
            settings.Certificates.Should().Contain(certificate);
            settings.Certificates.Should().Contain(certificate2);
            settings.SelectedResultFieldNames.Should().NotBeNullOrEmpty();
            settings.SelectedResultFieldNames.Should().Contain(fieldName);
            settings.SelectedResultFieldNames.Should().Contain(fieldName2);
            settings.CertificationTags.Should().NotBeNullOrEmpty();
            settings.CertificationTags.Should().Contain(certificationTags);
        }
    }
}