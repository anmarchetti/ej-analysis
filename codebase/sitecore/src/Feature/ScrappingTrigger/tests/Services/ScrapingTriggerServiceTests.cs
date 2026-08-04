using System;
using System.Collections.Generic;
using Amazon.SQS;
using Amazon.SQS.Model;
using AutoFixture.Xunit2;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.AmazonSqs.Logging;
using easyJet.Foundation.AmazonSqs.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Sitecore.Data;
using Sitecore.Globalization;
using Xunit;

namespace easyJet.Feature.ScrappingTrigger.Tests.Services
{
    public class ScrapingTriggerServiceTests
    {
        private readonly IScrappingTriggerLogger logger;
        private readonly IScrapingTriggerSettingsService settingsService;
        private readonly IAmazonSqsService amazonSqsService;
        private readonly IScrapingTriggerClientService clientService;
        private readonly IAmazonSqsLogger amazonSqsLogger;
        private readonly IAmazonSQS client;

        public ScrapingTriggerServiceTests()
        {
            logger = Substitute.For<IScrappingTriggerLogger>();
            settingsService = Substitute.For<IScrapingTriggerSettingsService>();
            clientService = Substitute.For<IScrapingTriggerClientService>();
            amazonSqsService = Substitute.For<IAmazonSqsService>();
            amazonSqsLogger = Substitute.For<IAmazonSqsLogger>();
            client = Substitute.For<IAmazonSQS>();
        }

        [Theory]
        [AutoData]
        public void EnQueue_ShouldReturnNull_IfClientNull(ID templateId)
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId }
            });

            clientService.GetClient().ReturnsNullForAnyArgs();

            var sut = new ScrapingTriggerService(logger, settingsService, clientService, amazonSqsService, amazonSqsLogger, false);

            // Act
            var result = sut.EnQueue(null);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void EnQueue_ShouldReturnNull_IfParameterNull(ID templateId)
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId }
            });

            clientService.GetClient().ReturnsForAnyArgs(client);

            var sut = new ScrapingTriggerService(logger, settingsService, clientService, amazonSqsService, amazonSqsLogger, false);

            // Act
            var result = sut.EnQueue(null);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void EnQueue_ShouldReturnNull_IfQueueUrlIsNull(ID templateId)
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId }
            });

            clientService.GetClient().ReturnsForAnyArgs(client);
            var messages = new Dictionary<Guid, string>
            {
                { Guid.NewGuid(), "test" }
            };

            amazonSqsService.GetQueueUrl(Arg.Any<string>()).ReturnsNullForAnyArgs();

            var sut = new ScrapingTriggerService(logger, settingsService, clientService, amazonSqsService, amazonSqsLogger, false);

            // Act
            var result = sut.EnQueue(messages);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void EnQueue_ShouldReturnNull_IfSqsThrowsError(ID templateId)
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId }
            });

            clientService.GetClient().ReturnsForAnyArgs(client);
            var messages = new Dictionary<Guid, string>
            {
                { Guid.NewGuid(), "test" }
            };

            amazonSqsService.GetQueueUrl(Arg.Any<string>()).ReturnsForAnyArgs("https://sqs.eu-west-1.amazonaws.com/021499708211/holidays-dev-scraping-queue");
            amazonSqsService.SendMessageBatch(Arg.Any<SendMessageBatchRequest>()).Throws(new Exception());

            var sut = new ScrapingTriggerService(logger, settingsService, clientService, amazonSqsService, amazonSqsLogger, false);

            // Act
            var result = sut.EnQueue(messages);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void EnQueue_ShouldReturnResponse(ID templateId)
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = "arn:aws:iam::123456789012:role/testAssumeRole",
                QueueArn = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue",
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId }
            });

            clientService.GetClient().ReturnsForAnyArgs(client);
            var messages = new Dictionary<Guid, string>
            {
                { Guid.NewGuid(), "test" }
            };

            amazonSqsService.GetQueueUrl(Arg.Any<string>()).ReturnsForAnyArgs("https://sqs.eu-west-1.amazonaws.com/021499708211/holidays-dev-scraping-queue");
            amazonSqsService.SendMessageBatch(Arg.Any<SendMessageBatchRequest>()).ReturnsForAnyArgs(new SendMessageBatchResponse());

            var sut = new ScrapingTriggerService(logger, settingsService, clientService, amazonSqsService, amazonSqsLogger, false);

            // Act
            var result = sut.EnQueue(messages);

            // Assert
            result.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }
    }
}