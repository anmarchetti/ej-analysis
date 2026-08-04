using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Amazon.SQS.Model;
using AutoFixture.Xunit2;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Processor;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Feature.ScrappingTrigger.Settings;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Publishing.Service.Client.Http;
using Sitecore.Publishing.Service.Client.Http.Item.Model;
using Sitecore.Publishing.Service.Client.Http.Manifest;
using Sitecore.Publishing.Service.Events;
using Sitecore.Publishing.Service.Pipelines.BulkPublishingEnd;
using Xunit;
using Language = Sitecore.Globalization.Language;

namespace easyJet.Feature.ScrappingTrigger.Tests.Pipelines
{
    public class ScrapingTriggerPublishEndProcessorTest
    {
        private readonly ScrapingTriggerPublishEndProcessor sut;
        private readonly IScrapingTriggerFilterService filterService;
        private readonly IScrapingTriggerService triggerService;
        private readonly IScrapingTriggerUrlService urlService;
        private readonly IScrapingTriggerSettingsService settingsService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IScrappingTriggerLogger logger;

        public ScrapingTriggerPublishEndProcessorTest()
        {
            filterService = Substitute.For<IScrapingTriggerFilterService>();
            triggerService = Substitute.For<IScrapingTriggerService>();
            urlService = Substitute.For<IScrapingTriggerUrlService>();
            settingsService = Substitute.For<IScrapingTriggerSettingsService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<IScrappingTriggerLogger>();
            sut = new ScrapingTriggerPublishEndProcessor(filterService, triggerService, urlService, settingsService, databaseProvider, logger);
        }

        [Fact]
        public void Process_ShouldDoNothing_IfArgsAreNull()
        {
            // Act
            sut.Process(null);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfJobDataIsNull()
        {
            // Arrange
            var batch = Array.Empty<ManifestOperationResult<ItemResult>>();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(null, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfBatchIsNull()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, null, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfSuspended()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var batch = Array.Empty<ManifestOperationResult<ItemResult>>();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);
            args.Suspend();

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfAborted()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var batch = Array.Empty<ManifestOperationResult<ItemResult>>();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);
            args.AbortPipeline();

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfBatchIsEmpty()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var batch = Array.Empty<ManifestOperationResult<ItemResult>>();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfDisabled()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings()
            {
                IsEnabled = false
            });

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfUnsupportedLanguage()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "de-DE" }
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings()
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en")
            });

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldDoNothing_IfNotFilteredItems(ID templateId)
        {
            // Arrange
            var parent = new FakeItem();
            var fakeItem = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithParent(parent).WithPath("/");
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en" }
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", templateId.Guid, parent.ID.Guid, fakeItem.ID.Guid), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = string.Empty,
                QueueArn = string.Empty,
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId },
                SupportedRootPath = "/"
            });

            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<Language>(), DatabaseType.Web).ReturnsForAnyArgs(fakeItem.ToSitecoreItem());
            filterService.IsMatching(Arg.Any<Item>()).ReturnsForAnyArgs(false);
            filterService.HasRedirect(Arg.Any<Item>()).ReturnsForAnyArgs(false);
            urlService.GetItemUrl(Arg.Any<Item>()).ReturnsForAnyArgs("/");

            triggerService.EnQueue(Arg.Any<Dictionary<Guid, string>>()).ReturnsForAnyArgs((SendMessageBatchResponse)null);

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldDoNothing_IfNotPageItemsEmpty(ID templateId)
        {
            // Arrange
            var parent = new FakeItem();
            var fakeItem = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithParent(parent);
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en" }
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", templateId.Guid, parent.ID.Guid, fakeItem.ID.Guid), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = string.Empty,
                QueueArn = string.Empty,
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId },
                SupportedRootPath = "/"
            });

            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<Language>(), DatabaseType.Web).ReturnsForAnyArgs(fakeItem.ToSitecoreItem());
            filterService.GetPageItems(Arg.Any<Item>(), Arg.Any<List<ID>>()).ReturnsForAnyArgs(Enumerable.Empty<Item>());
            filterService.IsMatching(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.HasRedirect(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            urlService.GetItemUrl(Arg.Any<Item>()).ReturnsForAnyArgs("/");

            triggerService.EnQueue(Arg.Any<Dictionary<Guid, string>>()).ReturnsForAnyArgs((SendMessageBatchResponse)null);

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldDoNothing_IfNotPageHasRedirect(ID templateId)
        {
            // Arrange
            var parent = new FakeItem();
            var fakeItem = new FakeItem()
                .WithRuntimeSettings()
                .WithTemplate(templateId)
                .WithParent(parent)
                .WithPath("/")
                .WithItemVersions();

            var item = fakeItem.ToSitecoreItem();
            item.Versions.Count.Returns(1);
            IEnumerable<Item> list = new[] { item };
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en" }
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", templateId.Guid, parent.ID.Guid, item.ID.Guid), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = string.Empty,
                QueueArn = string.Empty,
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId },
                SupportedRootPath = "/",
                MessagesPerBatch = Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch
            });

            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<Language>(), DatabaseType.Web).ReturnsForAnyArgs(item);
            filterService.IsMatching(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.HasRedirect(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.GetPageItems(Arg.Any<Item>(), Arg.Any<List<ID>>()).ReturnsForAnyArgs(list);
            urlService.GetItemUrl(Arg.Any<Item>()).ReturnsForAnyArgs("/");

            triggerService.EnQueue(Arg.Any<Dictionary<Guid, string>>()).ReturnsForAnyArgs(new SendMessageBatchResponse { Failed = new List<BatchResultErrorEntry>(), HttpStatusCode = HttpStatusCode.OK, Successful = new List<SendMessageBatchResultEntry>() });

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldEnqueue(ID templateId)
        {
            // Arrange
            var parent = new FakeItem();
            var fakeItem = new FakeItem()
                .WithRuntimeSettings()
                .WithTemplate(templateId)
                .WithParent(parent)
                .WithPath("/")
                .WithItemVersions();

            var item = fakeItem.ToSitecoreItem();
            item.Versions.Count.Returns(1);
            IEnumerable<Item> list = new[] { item };
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en" }
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", templateId.Guid, parent.ID.Guid, item.ID.Guid), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = string.Empty,
                QueueArn = string.Empty,
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId },
                SupportedRootPath = "/",
                MessagesPerBatch = Foundation.AmazonSqs.Constants.MaxNumberOfMessagesPerBatch
            });

            databaseProvider.GetItem(Arg.Any<ID>(), Arg.Any<Language>(), DatabaseType.Web).ReturnsForAnyArgs(item);
            filterService.IsMatching(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.HasRedirect(Arg.Any<Item>()).ReturnsForAnyArgs(false);
            filterService.GetPageItems(Arg.Any<Item>(), Arg.Any<List<ID>>()).ReturnsForAnyArgs(list);
            urlService.GetItemUrl(Arg.Any<Item>()).ReturnsForAnyArgs("/");

            triggerService.EnQueue(Arg.Any<Dictionary<Guid, string>>()).ReturnsForAnyArgs(new SendMessageBatchResponse { Failed = new List<BatchResultErrorEntry>(), HttpStatusCode = HttpStatusCode.OK, Successful = new List<SendMessageBatchResultEntry>() });

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldDoNothing_IfUnsupportedPath(ID templateId)
        {
            // Arrange
            var parent = new FakeItem();
            var fakeItem = new FakeItem()
                .WithRuntimeSettings()
                .WithTemplate(templateId)
                .WithParent(parent)
                .WithPath("/destination/spain")
                .WithLanguage("en")
                .WithItemVersions();

            var jobFakeItem = new FakeItem()
                .WithPath("/something/test")
                .WithTemplate(templateId)
                .WithLanguage("en");
            var jobItem = jobFakeItem.ToSitecoreItem();

            var item = fakeItem.ToSitecoreItem();
            item.Versions.Count.Returns(1);
            IEnumerable<Item> list = new[] { item };
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en" },
                ItemId = jobItem.ID.Guid
            };
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(jobItem.ID.Guid, ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", templateId.Guid, parent.ID.Guid, jobItem.ID.Guid), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);
            var path = item.Paths.FullPath;
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                SupportedLanguage = Language.Parse("en"),
                ProfileArn = string.Empty,
                QueueArn = string.Empty,
                SessionDuration = Foundation.AmazonSecurityToken.Constants.DefaultSessionDuration,
                SessionName = "Test",
                Templates = new HashSet<ID> { templateId },
                SupportedRootPath = path
            });

            databaseProvider.GetItem(jobItem.ID, jobItem.Language, DatabaseType.Web).Returns(jobItem);
            databaseProvider.GetItem(item.ID, item.Language, DatabaseType.Web).Returns(item);
            filterService.IsMatching(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.HasRedirect(Arg.Any<Item>()).ReturnsForAnyArgs(true);
            filterService.GetPageItems(Arg.Any<Item>(), Arg.Any<List<ID>>()).ReturnsForAnyArgs(list);
            urlService.GetItemUrl(Arg.Any<Item>()).ReturnsForAnyArgs("/");

            triggerService.EnQueue(Arg.Any<Dictionary<Guid, string>>()).ReturnsForAnyArgs(new SendMessageBatchResponse { Failed = new List<BatchResultErrorEntry>(), HttpStatusCode = HttpStatusCode.OK, Successful = new List<SendMessageBatchResultEntry>() });

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
