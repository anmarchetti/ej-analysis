using AutoFixture.Xunit2;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ScrappingTrigger.Tests.Services
{
    public class ScrapingTriggerSettingsServiceTests
    {
        private readonly ScrapingTriggerSettingsService sut;
        private readonly BaseSettings settingsService;
        private readonly IDatabaseProvider databaseProvider;

        public ScrapingTriggerSettingsServiceTests()
        {
            settingsService = Substitute.For<BaseSettings>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sut = new ScrapingTriggerSettingsService(settingsService, databaseProvider);
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
            settings.Templates.Should().NotBeNull();
            settings.Templates.Should().BeEmpty();
            settings.SupportedLanguage.Should().BeNull();
            settings.ProfileArn.Should().BeNullOrEmpty();
            settings.QueueArn.Should().BeNullOrEmpty();
            settings.VpcEndpoint.Should().BeNullOrEmpty();
            settings.SupportedRootPath.Should().BeNullOrEmpty();
            settings.MessagesPerBatch.Should().Be(0);
        }

        [Theory]
        [AutoData]
        public void GetSettings_ShouldReturnSettings(ID id)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings()
                .WithField(Constants.Fields.ScrapingTriggerEnabledTemplates, id.ToString())
                .WithField(Constants.Fields.ScrapingTriggerIsEnabled, "1");

            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsForAnyArgs(item);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeFalse();
            settings.Templates.Should().NotBeNull();
            settings.Templates.Should().NotBeEmpty();
            settings.Templates.Should().Contain(id);
            settings.SupportedLanguage.Should().NotBeNull();

            settings.ProfileArn.Should().BeNullOrEmpty();
            settings.QueueArn.Should().BeNullOrEmpty();
            settings.SessionDuration.Should().Be(0);
            settings.SessionName.Should().BeNullOrEmpty();
            settings.VpcEndpoint.Should().BeNullOrEmpty();
            settings.SupportedRootPath.Should().BeNullOrEmpty();
            settings.BaseUrl.Should().BeNullOrEmpty();
            settings.MessagesPerBatch.Should().Be(0);
        }

        [Theory]
        [AutoData]
        public void GetSettings_ShouldReturnSettings2(ID id, string sessionName, string queueArn, string profileArn, string vpcEndpoint, string rootPath, string baseUrl)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings()
                .WithField(Constants.Fields.ScrapingTriggerEnabledTemplates, id.ToString())
                .WithField(Constants.Fields.ScrapingTriggerIsEnabled, "1");
            int sessionDuration = 901;
            settingsService.GetSetting(Constants.ScrapingTriggerSettingsSessionName).Returns(sessionName);
            settingsService.GetSetting(Constants.ScrapingTriggerSettingsProfileArn).Returns(profileArn);
            settingsService.GetSetting(Constants.ScrapingTriggerSettingsQueueArn).Returns(queueArn);
            settingsService.GetSetting(Foundation.AmazonSqs.Constants.VpcEndpoint).Returns(vpcEndpoint);
            settingsService.GetSetting(Constants.ScrapingTriggerSettingsSupportedLanguage).Returns("en");
            settingsService.GetIntSetting(Constants.ScrapingTriggerSettingsSessionDuration, Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration).Returns(sessionDuration);
            databaseProvider.GetItem(Arg.Any<string>(), DatabaseType.Master).ReturnsForAnyArgs(item);
            settingsService.GetSetting(Constants.ScrapingTriggerSettingsSupportedRootPath).Returns(rootPath);
            settingsService.GetBoolSetting(Constants.ScrapingTriggerEnabled, false).Returns(true);
            settingsService.GetSetting(Constants.ScrapingTriggerBaseUrl).Returns(baseUrl);
            settingsService.GetIntSetting(Constants.ScrapingTriggerMessagesPerBatch, Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch).Returns(Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.IsEnabled.Should().BeTrue();
            settings.Templates.Should().NotBeNull();
            settings.Templates.Should().NotBeEmpty();
            settings.Templates.Should().Contain(id);
            settings.SupportedLanguage.Should().NotBeNull();
            settings.SupportedLanguage.Name.Should().Be("en");

            settings.ProfileArn.Should().Be(profileArn);
            settings.QueueArn.Should().Be(queueArn);
            settings.SessionDuration.Should().Be(sessionDuration);
            settings.SessionName.Should().Be(sessionName);
            settings.VpcEndpoint.Should().Be(vpcEndpoint);
            settings.SupportedRootPath.Should().Be(rootPath);
            settings.BaseUrl.Should().Be(baseUrl);
            settings.MessagesPerBatch.Should().Be(Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch);
        }
    }
}