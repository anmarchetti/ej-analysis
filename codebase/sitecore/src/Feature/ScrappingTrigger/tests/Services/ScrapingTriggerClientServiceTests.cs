using System;
using Amazon;
using Amazon.SecurityToken.Model;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.AmazonSecurityToken.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Sitecore.Collections;
using Xunit;

namespace easyJet.Feature.ScrappingTrigger.Tests.Services
{
    public class ScrapingTriggerClientServiceTests
    {
        private readonly IScrapingTriggerSettingsService settingsService;
        private readonly ITemporaryCredentialsService temporaryCredentialsService;
        private readonly IScrappingTriggerLogger logger;

        public ScrapingTriggerClientServiceTests()
        {
            settingsService = Substitute.For<IScrapingTriggerSettingsService>();
            temporaryCredentialsService = Substitute.For<ITemporaryCredentialsService>();
            logger = Substitute.For<IScrappingTriggerLogger>();
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfSettingAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfSettingNotEnabled()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = false
            });
            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfSettingAreNotCorrect()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = string.Empty
            });
            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfSettingAreNotCorrect2()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = "arn:aws:sqs: :021499708211:holidays-dev-scraping-queue"
            });
            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();

            // AWS SDK v4: RegionEndpoint.GetBySystemName no longer throws for an unknown region,
            // so the malformed ARN now flows to the credentials-null branch (2-arg Error) instead
            // of the catch branch (3-arg Error) reached in v3.
            logger.Received().Error(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfCredentialsAreNull()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                SessionName = "test"
            });

            temporaryCredentialsService
                .GetCredentials(Arg.Any<string>(), Arg.Any<RegionEndpoint>(), Arg.Any<int>(), Arg.Any<string>())
                .ReturnsNullForAnyArgs();

            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnNull_IfCredentialsThrowsError()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                SessionName = "test"
            });

            temporaryCredentialsService
                .GetCredentials(Arg.Any<string>(), Arg.Any<RegionEndpoint>(), Arg.Any<int>(), Arg.Any<string>()).Throws(new Exception());

            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnClient()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                SessionName = "test"
            });

            temporaryCredentialsService
                .GetCredentials(Arg.Any<string>(), Arg.Any<RegionEndpoint>(), Arg.Any<int>(), Arg.Any<string>()).ReturnsForAnyArgs(new Credentials());

            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetClient_ShouldReturnClient2()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                SessionName = "test",
                VpcEndpoint = "https://vpce-0246e38562276b3f9-reka8e31.sqs.eu-west-1.vpce.amazonaws.com"
            });

            temporaryCredentialsService
                .GetCredentials(Arg.Any<string>(), Arg.Any<RegionEndpoint>(), Arg.Any<int>(), Arg.Any<string>()).ReturnsForAnyArgs(new Credentials());

            var sut = new ScrapingTriggerClientService(settingsService, temporaryCredentialsService, logger);

            // Act
            var client = sut.GetClient();

            // Assert
            client.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}