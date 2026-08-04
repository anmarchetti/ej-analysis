using System;
using System.Collections.Generic;
using System.Reflection;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Pipelines.HbgImagesToS3Sync;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Collections;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Pipelines
{
    public class HbgImagesToS3SyncProcessorTests
    {
        private const string HbgPrefix = "https://photos.hotelbeds.com";

        private readonly IDatabaseProvider databaseProvider;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IHotelBedsLogger logger;
        private readonly BaseMediaManager mediaManager;
        private readonly ISyncDataService syncDataService;
        private readonly BaseSettings settings;

        public HbgImagesToS3SyncProcessorTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            logger = Substitute.For<IHotelBedsLogger>();
            mediaManager = Substitute.For<BaseMediaManager>();
            syncDataService = Substitute.For<ISyncDataService>();
            settings = Substitute.For<BaseSettings>();

            settings.GetSetting(Destinations.Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgPrefix);
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.S3KeyPrefix", Arg.Any<string>()).Returns("hbg");
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.ReportPath", Arg.Any<string>()).Returns(string.Empty);
        }

        [Fact]
        public void Process_ShouldUpdateHbgImageUrlFields_WhenSyncReturnsS3Urls()
        {
            // Arrange
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                $"{hotelItem.ID.Guid:N}",
                Arg.Is<IDictionary<string, string>>(x =>
                    x.Count == 1 &&
                    x.ContainsKey(Destinations.Constants.Fields.ExternalImageItem.Small)),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
            datasourceRepository.DidNotReceive().GetOrCreateItem(
                Arg.Any<string>(),
                Sitecore.TemplateIDs.UnversionedFile,
                Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldCreateFailureReport_WhenHbgImageCannotBeUploaded()
        {
            // Arrange
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.ReportPath", Arg.Any<string>()).Returns("/sitecore/system/reports");

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("failed-image")
                .WithPath("/sitecore/content/failed-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/broken.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            var reportFolder = new FakeItem().WithPath("/sitecore/system/reports").ToSitecoreItem();
            var reportItem = new FakeItem().WithTemplate(Sitecore.TemplateIDs.UnversionedFile).WithPath("/sitecore/media library/report").ToSitecoreItem();
            var media = Substitute.For<Media>();
            databaseProvider.GetItem("/sitecore/system/reports", DatabaseType.Master).Returns(reportFolder);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Sitecore.TemplateIDs.UnversionedFile, reportFolder).Returns(reportItem);
            mediaManager.GetMedia(Arg.Any<MediaItem>()).Returns(media);

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" }
                    };

                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            datasourceRepository.Received(1).GetOrCreateItem(
                Arg.Is<string>(x => x.StartsWith("HbgImagesToS3SyncFailures_")),
                Sitecore.TemplateIDs.UnversionedFile,
                reportFolder);
            media.Received(1).SetStream(Arg.Any<System.IO.Stream>(), "csv");
        }

        [Fact]
        public void Process_ShouldDelete_WhenAllImageSizesFail()
        {
            // Arrange
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.ReportPath", Arg.Any<string>()).Returns("/sitecore/system/reports");

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("all-failed-image")
                .WithPath("/sitecore/content/all-failed-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/broken.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, $"{HbgPrefix}/medium/broken.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, $"{HbgPrefix}/large/broken.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            var reportFolder = new FakeItem().WithPath("/sitecore/system/reports").ToSitecoreItem();
            var reportItem = new FakeItem().WithTemplate(Sitecore.TemplateIDs.UnversionedFile).WithPath("/sitecore/media library/report").ToSitecoreItem();
            var media = Substitute.For<Media>();
            databaseProvider.GetItem("/sitecore/system/reports", DatabaseType.Master).Returns(reportFolder);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Sitecore.TemplateIDs.UnversionedFile, reportFolder).Returns(reportItem);
            mediaManager.GetMedia(Arg.Any<MediaItem>()).Returns(media);

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" },
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, "HTTP 500" },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, "HTTP 403" }
                    };

                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null },
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, null },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received().Warn(
                Arg.Is<string>(msg => msg.Contains("deleted ExternalImage")),
                Arg.Any<object>());
            datasourceRepository.Received(1).GetOrCreateItem(
                Arg.Is<string>(x => x.StartsWith("HbgImagesToS3SyncFailures_")),
                Sitecore.TemplateIDs.UnversionedFile,
                reportFolder);
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("updated items: 0") &&
                    msg.Contains("updated fields: 0") &&
                    msg.Contains("deleted items: 1") &&
                    msg.Contains("failed URLs: 4")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldNotLogRecycleWarning_WhenAtLeastOneSizeSyncsSuccessfully()
        {
            // Arrange
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, $"{HbgPrefix}/medium/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, $"{HbgPrefix}/large/image.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, "HTTP 500" },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, "HTTP 403" }
                    };

                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" },
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, null },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.DidNotReceive().Warn(
                Arg.Is<string>(msg => msg.Contains("deleted ExternalImage")),
                Arg.Any<object>());
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("updated items: 1") &&
                    msg.Contains("updated fields: 3")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldContinueProcessing_WhenSingleImageThrowsException()
        {
            // Arrange
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(parentFakeItem);

            var throwingImageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("throwing-image")
                .WithPath("/sitecore/content/throwing-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/throw.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var goodImageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("good-image")
                .WithPath("/sitecore/content/good-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/good.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var throwingImageItem = throwingImageFakeItem.ToSitecoreItem();
            var goodImageItem = goodImageFakeItem.ToSitecoreItem();

            var callCount = 0;
            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callCount++;
                    if (callCount == 1)
                    {
                        throw new InvalidOperationException("Simulated S3 failure");
                    }

                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            syncDataService.Received(2).SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
            logger.Received(1).Error(
                Arg.Is<string>(msg =>
                    msg.Contains("failed to process image") &&
                    msg.Contains("Continuing with next image")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("updated items: 1")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldContinueProcessing_WhenSingleHotelThrowsException()
        {
            // Arrange
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();

            var brokenHotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithPath("/sitecore/content/broken-hotel")
                .WithParent(parentFakeItem);
            var brokenHotelItem = brokenHotelFakeItem.ToSitecoreItem();
            brokenHotelItem[Arg.Any<string>()].Returns(_ => { throw new InvalidOperationException("Simulated hotel failure"); });

            var goodHotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "GOOD-123")
                .WithParent(parentFakeItem);
            var goodImageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("good-image")
                .WithPath("/sitecore/content/good-hotel/Images/good-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/good.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(goodHotelFakeItem);
            var parent = parentFakeItem.ToSitecoreItem();
            var goodHotelItem = goodHotelFakeItem.ToSitecoreItem();
            var goodImageItem = goodImageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
            logger.Received(1).Error(
                Arg.Is<string>(msg =>
                    msg.Contains("failed to process hotel") &&
                    msg.Contains("Continuing with next hotel")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("updated items: 1")),
                Arg.Any<object>());
        }

        [Fact]
        public void TryMigrateImageItem_ShouldReturnFalse_WhenItemGetsDeleted()
        {
            // Arrange
            var imageItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("all-failed-image")
                .WithPath("/sitecore/content/all-failed-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/broken.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty)
                .WithItemEditing()
                .WithItemVersions()
                .ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" }
                    };

                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null }
                    };
                });

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            var result = InvokeTryMigrateImageItem(sut, imageItem, "HB456", "HB456", failedRecords, out var changedFieldsCount, out var itemDeleted);

            // Assert
            result.Should().BeFalse();
            itemDeleted.Should().BeTrue();
            changedFieldsCount.Should().Be(0);
        }

        [Fact]
        public void TryDeleteImageItem_ShouldDelete_WhenAllImageSizeFieldsAreEmpty()
        {
            // Arrange
            var imageItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("empty-image")
                .WithPath("/sitecore/content/empty-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty)
                .WithItemEditing()
                .WithItemVersions()
                .ToSitecoreItem();

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            InvokeTryDeleteImageItem(sut, imageItem, "HB456", failedRecords);

            // Assert
            failedRecords.Should().ContainSingle(x => x.Field == "__DELETED__");
            failedRecords.Should().ContainSingle(x => x.Error == "Image item try delete because all size uploads failed.");
            logger.Received().Warn(
                Arg.Is<string>(msg => msg.Contains("deleted ExternalImage")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldAbort_WhenParentIsNull()
        {
            // Arrange
            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = null });

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("aborted") && msg.Contains("parent item is null")),
                Arg.Any<object>());
            syncDataService.DidNotReceive().SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldAbort_WhenArgsIsNull()
        {
            // Arrange
            var sut = CreateSut();

            // Act
            sut.Process(null);

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("aborted") && msg.Contains("parent item is null")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldAbort_WhenHbgImagePrefixIsEmpty()
        {
            // Arrange
            settings.GetSetting(Destinations.Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(string.Empty);
            var sut = CreateSut();

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var parent = parentFakeItem.ToSitecoreItem();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("aborted") && msg.Contains("is empty")),
                Arg.Any<object>());
            syncDataService.DidNotReceive().SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldFindHotelsNestedUnderIntermediateItems()
        {
            // Arrange: parent > country > resort > hotel (3 levels deep)
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content/Destinations").WithItemAxes();
            var countryFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Country).WithItemAxes().WithParent(parentFakeItem);
            var resortFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Resort).WithItemAxes().WithParent(countryFakeItem);
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "NESTED-001")
                .WithParent(resortFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var countryItem = countryFakeItem.ToSitecoreItem();
            var resortItem = resortFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received().Info(
                Arg.Is<string>(msg => msg.Contains("started for 1 hotels")),
                Arg.Any<object>());
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                "NESTED-001",
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
        }

        [Fact]
        public void Process_ShouldFindHotelsAcrossMultipleBranchesAtDifferentDepths()
        {
            // Arrange: parent has two branches with hotels at different depths
            //   parent > country1 > resort1 > hotelA
            //   parent > country2 > hotelB (directly under country)
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content/Destinations").WithItemAxes();

            var country1FakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Country).WithItemAxes().WithParent(parentFakeItem);
            var resort1FakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Resort).WithItemAxes().WithParent(country1FakeItem);
            var hotelAFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "HOTEL-A")
                .WithParent(resort1FakeItem);
            var imageAFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/a.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelAFakeItem);

            var country2FakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Country).WithItemAxes().WithParent(parentFakeItem);
            var hotelBFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "HOTEL-B")
                .WithParent(country2FakeItem);
            var imageBFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/b.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelBFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var country1 = country1FakeItem.ToSitecoreItem();
            var resort1 = resort1FakeItem.ToSitecoreItem();
            var hotelA = hotelAFakeItem.ToSitecoreItem();
            var imageA = imageAFakeItem.ToSitecoreItem();
            var country2 = country2FakeItem.ToSitecoreItem();
            var hotelB = hotelBFakeItem.ToSitecoreItem();
            var imageB = imageBFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received().Info(
                Arg.Is<string>(msg => msg.Contains("started for 2 hotels")),
                Arg.Any<object>());
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                "HOTEL-A",
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                "HOTEL-B",
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
        }

        [Fact]
        public void Process_ShouldLogZeroHotels_WhenNoHotelsExistUnderParent()
        {
            // Arrange: parent has children but none are Accommodation
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content/Destinations").WithItemAxes();
            var countryFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Country).WithItemAxes().WithParent(parentFakeItem);
            var resortFakeItem = new FakeItem().WithTemplate(Destinations.Constants.TemplateIds.Resort).WithItemAxes().WithParent(countryFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var country = countryFakeItem.ToSitecoreItem();
            var resort = resortFakeItem.ToSitecoreItem();

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received().Info(
                Arg.Is<string>(msg => msg.Contains("started for 0 hotels")),
                Arg.Any<object>());
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("Scanned items: 0") &&
                    msg.Contains("updated items: 0")),
                Arg.Any<object>());
            syncDataService.DidNotReceive().SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldNotDescendIntoHotelChildren_WhenSearchingForHotels()
        {
            // Arrange: parent > hotel > room (room has Accommodation template to prove we don't recurse into hotel)
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "HOTEL-1")
                .WithParent(parentFakeItem);

            var nestedAccommodationFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithParent(hotelFakeItem);

            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var nestedAccommodation = nestedAccommodationFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert: only the top-level hotel is found, not the nested one
            logger.Received().Info(
                Arg.Is<string>(msg => msg.Contains("started for 1 hotels")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldAbortPipeline_WhenUnhandledExceptionOccurs()
        {
            // Arrange: GetChildren throws -> bubbles up to Process catch -> AbortPipeline
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var parent = parentFakeItem.ToSitecoreItem();
            parent.GetChildren(Arg.Any<ChildListOptions>())
                .Returns<ChildList>(_ => { throw new InvalidOperationException("Simulated database error"); });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received(1).Error(
                Arg.Is<string>(msg => msg.Contains(nameof(HbgImagesToS3SyncProcessor))),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldWarn_WhenReportFolderNotFound()
        {
            // Arrange: failures occur, report path is set, but folder doesn't exist
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.ReportPath", Arg.Any<string>()).Returns("/sitecore/system/reports");

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            databaseProvider.GetItem("/sitecore/system/reports", DatabaseType.Master).Returns((Item)null);

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" }
                    };
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("report folder") && msg.Contains("was not found")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldHandleNullReportItem()
        {
            // Arrange: failures occur, report folder exists, but GetOrCreateItem returns null
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.ReportPath", Arg.Any<string>()).Returns("/sitecore/system/reports");

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri().WithItemAxes().WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            var reportFolder = new FakeItem().WithPath("/sitecore/system/reports").ToSitecoreItem();
            databaseProvider.GetItem("/sitecore/system/reports", DatabaseType.Master).Returns(reportFolder);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Sitecore.TemplateIDs.UnversionedFile, reportFolder).Returns((Item)null);

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" }
                    };
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert: report creation attempted but returned null; process still completed
            datasourceRepository.Received(1).GetOrCreateItem(
                Arg.Is<string>(x => x.StartsWith("HbgImagesToS3SyncFailures_")),
                Sitecore.TemplateIDs.UnversionedFile,
                reportFolder);
            logger.Received().Info(
                Arg.Is<string>(msg => msg.Contains("completed.") && msg.Contains("report: none")),
                Arg.Any<object>());
        }

        [Fact]
        public void TryDeleteImageItem_ShouldLogError_WhenDeleteThrows()
        {
            // Arrange
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("locked-image")
                .WithPath("/sitecore/content/locked-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty);
            var imageItem = imageFakeItem.ToSitecoreItem();
            imageItem.When(x => x.Delete()).Do(_ => { throw new InvalidOperationException("Item is locked"); });

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            var result = (bool)typeof(HbgImagesToS3SyncProcessor)
                .GetMethod("TryDeleteImageItem", BindingFlags.Instance | BindingFlags.NonPublic)
                .Invoke(sut, new object[] { imageItem, "HB999", failedRecords });

            // Assert
            result.Should().BeFalse();
            logger.Received(1).Error(
                Arg.Is<string>(msg => msg.Contains("failed to delete ExternalImage")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }

        [Fact]
        public void TryMigrateImageItem_ShouldReturnFalse_WhenNoHbgUrlsPresent()
        {
            // Arrange: all image URLs are non-HBG
            var imageItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, "https://other-cdn/small.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other-cdn/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other-cdn/large.jpg")
                .ToSitecoreItem();

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            var result = InvokeTryMigrateImageItem(sut, imageItem, "HB123", "HB123", failedRecords, out var changedFieldsCount, out var itemDeleted);

            // Assert
            result.Should().BeFalse();
            changedFieldsCount.Should().Be(0);
            itemDeleted.Should().BeFalse();
            syncDataService.DidNotReceive().SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                Arg.Any<string>());
        }

        [Fact]
        public void Process_ShouldFallThroughToBulkUpdate_WhenDeletionFails()
        {
            // Arrange: all 3 HBG sizes fail, Delete() throws, BulkUpdate still runs
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri().WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode, "HB-DELFAIL")
                .WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithName("delete-fail-image")
                .WithPath("/sitecore/content/delete-fail-image")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/img.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, $"{HbgPrefix}/medium/img.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, $"{HbgPrefix}/large/img.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            imageItem.When(x => x.Delete()).Do(_ => { throw new InvalidOperationException("Item is locked"); });

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" },
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, "HTTP 500" },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, "HTTP 403" }
                    };
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null },
                        { Destinations.Constants.Fields.ExternalImageItem.Medium, null },
                        { Destinations.Constants.Fields.ExternalImageItem.Large, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert: delete failed, but processing continued with BulkUpdate
            logger.Received(1).Error(
                Arg.Is<string>(msg => msg.Contains("failed to delete ExternalImage")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
            logger.Received().Info(
                Arg.Is<string>(msg =>
                    msg.Contains("completed.") &&
                    msg.Contains("deleted items: 0") &&
                    msg.Contains("updated items: 1")),
                Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldWarn_WhenSyncFailuresExistButReportPathSettingIsEmpty()
        {
            // Arrange: failures are recorded but report cannot be written (default empty report path in ctor)
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/broken.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "HTTP 404" }
                    };
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, null }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("HotelBeds.HbgImagesToS3Sync.ReportPath") && msg.Contains("empty")),
                Arg.Any<object>());
            datasourceRepository.DidNotReceive().GetOrCreateItem(
                Arg.Any<string>(),
                Sitecore.TemplateIDs.UnversionedFile,
                Arg.Any<Item>());
        }

        [Fact]
        public void Process_ShouldPassTrimmedS3KeyPrefix_ToSyncService()
        {
            // Arrange
            settings.GetSetting("HotelBeds.HbgImagesToS3Sync.S3KeyPrefix", Arg.Any<string>()).Returns("///hbg-prefix///");

            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert: constructor trims leading/trailing slashes from the S3 key prefix setting
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                Arg.Any<string>(),
                Arg.Any<IDictionary<string, string>>(),
                Arg.Any<string>(),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg-prefix");
        }

        [Fact]
        public void Process_ShouldWarn_WhenBulkUpdateFailsAfterSuccessfulSync()
        {
            // Arrange: BulkUpdate catches an exception from EndEdit and returns false -> processor warns
            var parentFakeItem = new FakeItem().WithPath("/sitecore/content").WithItemAxes();
            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithUri()
                .WithItemAxes()
                .WithParent(parentFakeItem);
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/small/image.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, "https://other/medium.jpg")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, "https://other/large.jpg")
                .WithItemEditing()
                .WithItemVersions()
                .WithParent(hotelFakeItem);

            var parent = parentFakeItem.ToSitecoreItem();
            var imageItem = imageFakeItem.ToSitecoreItem();

            imageItem.Editing.When(e => e.BeginEdit()).Do(_ => throw new InvalidOperationException("Simulated BeginEdit failure"));

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/new-small.jpg" }
                    };
                });

            var sut = CreateSut();

            // Act
            sut.Process(new DestinationPipelineArgs { Parent = parent });

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(msg => msg.Contains("Failed to update image item fields via BulkUpdate")),
                Arg.Any<object>());
        }

        [Fact]
        public void CreateFailedLinksReport_ShouldReturnNull_WhenFailedRecordsIsNull()
        {
            var sut = CreateSut();
            var method = typeof(HbgImagesToS3SyncProcessor).GetMethod(
                "CreateFailedLinksReport",
                BindingFlags.Instance | BindingFlags.NonPublic);
            method.Should().NotBeNull();

            var result = method.Invoke(sut, new object[] { null });

            result.Should().BeNull();
        }

        [Fact]
        public void TryMigrateImageItem_ShouldUseFallbackFileName_WhenUrlHasNoPath()
        {
            // Arrange: HBG URL with no file path triggers ResolveFileName GUID fallback
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty)
                .WithItemEditing()
                .WithItemVersions();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/uploaded.jpg" }
                    };
                });

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            var result = InvokeTryMigrateImageItem(sut, imageItem, "HB123", "HB123", failedRecords, out var changedFieldsCount, out var itemDeleted);

            // Assert: image name falls back to GUID-based name
            result.Should().BeTrue();
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                "HB123",
                Arg.Any<IDictionary<string, string>>(),
                Arg.Is<string>(name => name.EndsWith(".jpg") && name.Contains(imageItem.ID.Guid.ToString("N"))),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
        }

        [Fact]
        public void TryMigrateImageItem_ShouldUseSanitizedFileName_WhenUriPathContainsInvalidFileNameCharacters()
        {
            // Arrange: Path.GetFileName from absolute URI may contain characters invalid for file names (e.g. '*').
            var unsafeFileName = "photo*name.jpg";
            var imageFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.ExternalImage)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Small, $"{HbgPrefix}/gallery/{unsafeFileName}")
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Medium, string.Empty)
                .WithField(Destinations.Constants.Fields.ExternalImageItem.Large, string.Empty)
                .WithItemEditing()
                .WithItemVersions();
            var imageItem = imageFakeItem.ToSitecoreItem();

            Dictionary<string, string> syncErrors;
            syncDataService
                .SyncImageUrlsToAmazonS3(
                    Arg.Any<string>(),
                    Arg.Any<IDictionary<string, string>>(),
                    Arg.Any<string>(),
                    out syncErrors,
                    Arg.Any<string>())
                .Returns(callInfo =>
                {
                    callInfo[3] = new Dictionary<string, string>();
                    return new Dictionary<string, string>
                    {
                        { Destinations.Constants.Fields.ExternalImageItem.Small, "https://s3/uploaded.jpg" }
                    };
                });

            var sut = CreateSut();
            var failedRecords = new List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord>();

            // Act
            var result = InvokeTryMigrateImageItem(sut, imageItem, "HB123", "HB123", failedRecords, out var changedFieldsCount, out var itemDeleted);

            // Assert
            result.Should().BeTrue();
            syncDataService.Received(1).SyncImageUrlsToAmazonS3(
                "HB123",
                Arg.Any<IDictionary<string, string>>(),
                Arg.Is<string>(name => name == "photo_name.jpg"),
                out Arg.Any<Dictionary<string, string>>(),
                "hbg");
            changedFieldsCount.Should().BeGreaterThan(0);
            itemDeleted.Should().BeFalse();
        }

        private void InvokeTryDeleteImageItem(
            HbgImagesToS3SyncProcessor sut,
            Item imageItem,
            string hotelBedsCode,
            List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord> failedRecords)
        {
            var method = typeof(HbgImagesToS3SyncProcessor).GetMethod("TryDeleteImageItem", BindingFlags.Instance | BindingFlags.NonPublic);
            method.Should().NotBeNull();

            var args = new object[] { imageItem, hotelBedsCode, failedRecords };
            method.Invoke(sut, args);
        }

        // TryMigrateImageItem only; full pipeline also runs CacheHelper.ClearCaches from ProcessHotel after migrate/delete.
        private bool InvokeTryMigrateImageItem(
            HbgImagesToS3SyncProcessor sut,
            Item imageItem,
            string hotelBedsCode,
            string s3HotelCode,
            List<easyJet.Foundation.HotelBeds.Reports.Models.FailedImageSyncRecord> failedRecords,
            out int changedFieldsCount,
            out bool itemDeleted)
        {
            var method = typeof(HbgImagesToS3SyncProcessor).GetMethod("TryMigrateImageItem", BindingFlags.Instance | BindingFlags.NonPublic);
            method.Should().NotBeNull();

            var args = new object[] { imageItem, hotelBedsCode, s3HotelCode, failedRecords, 0, false };
            var result = method.Invoke(sut, args);

            changedFieldsCount = (int)args[4];
            itemDeleted = (bool)args[5];
            return (bool)result;
        }

        private HbgImagesToS3SyncProcessor CreateSut()
        {
            return new HbgImagesToS3SyncProcessor(
                databaseProvider,
                datasourceRepository,
                logger,
                mediaManager,
                syncDataService,
                settings);
        }
    }
}
