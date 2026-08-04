using System;
using System.Collections.Generic;
using easyJet.Foundation.Publishing.Logging;
using easyJet.Foundation.Publishing.Pipelines;
using NSubstitute;
using Sitecore.Publishing.Service.Client.Http;
using Sitecore.Publishing.Service.Client.Http.Item.Model;
using Sitecore.Publishing.Service.Client.Http.Manifest;
using Sitecore.Publishing.Service.Events;
using Sitecore.Publishing.Service.Pipelines.BulkPublishingEnd;
using Xunit;

namespace easyJet.Foundation.Publishing.Tests.Pipelines
{
    public class LogPublishingEndProcessorTests
    {
        private readonly LogPublishingEndProcessor sut;
        private readonly IPublishingLogger logger;

        public LogPublishingEndProcessorTests()
        {
            logger = Substitute.For<IPublishingLogger>();
            sut = new LogPublishingEndProcessor(logger);
        }

        [Fact]
        public void Process_NoLog_IfArgsNull()
        {
            // Act
            sut.Process(null);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_NoLog_IfAborted()
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
        }

        [Fact]
        public void Process_NoLog_IfSuspended()
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
        }

        [Fact]
        public void Process_NoLog_IfBatchIsNull()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, null, targetInfo, 1, 0);
            args.Suspend();

            // Act
            sut.Process(args);

            // Assert
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_LogInfo()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(Guid.NewGuid(), ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Debug(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_LogInfo_ContainsJobMetadata()
        {
            // Arrange
            var itemId = Guid.NewGuid();
            var manifestId = Guid.NewGuid();
            var targetId = Guid.NewGuid();
            var jobData = new PublishingJobEndEvent
            {
                LanguageNames = new List<string> { "en", "de" },
                ItemId = itemId,
                Username = "sitecore\\admin",
                PublishType = "SingleItem",
                IncludeDescendants = true,
                SourceDatabaseName = "master",
                Metadata = new Dictionary<string, string> { { "sc.publishmode", "smart" } }
            };
            var entityId = Guid.NewGuid();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(entityId, ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("name", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata
            {
                TargetDatabaseName = "web",
                TargetName = "Internet",
                TargetId = targetId,
                ManifestId = manifestId
            };
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(
                Arg.Is<string>(s =>
                    s.Contains("sitecore\\admin") &&
                    s.Contains("SingleItem") &&
                    s.Contains("en, de") &&
                    s.Contains(itemId.ToString()) &&
                    s.Contains("master") &&
                    s.Contains("web") &&
                    s.Contains("Internet") &&
                    s.Contains(targetId.ToString()) &&
                    s.Contains(manifestId.ToString()) &&
                    s.Contains("sc.publishmode=smart") &&
                    s.Contains(entityId.ToString())),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_LogInfo_ContainsItemProperties()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var templateId = Guid.NewGuid();
            var parentId = Guid.NewGuid();
            var entityId = Guid.NewGuid();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(entityId, ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("Hotel Page", templateId, parentId, Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(
                Arg.Is<string>(s =>
                    s.Contains("Hotel Page") &&
                    s.Contains(templateId.ToString()) &&
                    s.Contains(parentId.ToString()) &&
                    s.Contains(entityId.ToString())),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_LogInfo_HandlesDeletedItemsWithoutProperties()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var deletedId = Guid.NewGuid();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(deletedId, ManifestOperationResultType.Deleted, ManifestEntityType.Item, ItemResult.Deleted(new ItemProperties("deleted-item", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid())))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(
                Arg.Is<string>(s =>
                    s.Contains(deletedId.ToString()) &&
                    s.Contains("(no properties)")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_LogInfo_ShowsDistinctItemCount()
        {
            // Arrange
            var jobData = new PublishingJobEndEvent();
            var sharedId = Guid.NewGuid();
            var batch = new[]
            {
                new ManifestOperationResult<ItemResult>(sharedId, ManifestOperationResultType.Deleted, ManifestEntityType.Item, ItemResult.Deleted(new ItemProperties("item", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()))),
                new ManifestOperationResult<ItemResult>(sharedId, ManifestOperationResultType.Created, ManifestEntityType.Item, ItemResult.Created(new ItemProperties("item", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), new List<IVarianceIdentifier>()))
            };
            var targetInfo = new PublishingJobTargetMetadata();
            var args = new PublishEndResultBatchArgs(jobData, batch, targetInfo, 1, 0);

            // Act
            sut.Process(args);

            // Assert
            logger.Received().Info(
                Arg.Is<string>(s =>
                    s.Contains("2 raw, 1 distinct")),
                Arg.Any<object>());
        }
    }
}
