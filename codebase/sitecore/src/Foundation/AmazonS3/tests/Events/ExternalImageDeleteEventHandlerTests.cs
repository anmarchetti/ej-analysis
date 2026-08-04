using System;
using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.AmazonS3.ContentSearch.Repositories;
using easyJet.Foundation.AmazonS3.ContentSearch.SearchTypes;
using easyJet.Foundation.AmazonS3.Events;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Service;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Events;
using Sitecore.NSubstituteUtils;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.Events
{
    public class ExternalImageDeleteEventHandlerTests
    {
        private readonly ExternalImageDeleteEventHandler eventHandler;
        private readonly IAmazonS3Logger logger;
        private readonly IAmazonS3ImageBucketService amazonS3Service;
        private readonly IHotelReportService hotelReportService;
        private readonly IExternaImagesRepository externaImagesRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IEnvironmentHintSettingsService settings;

        public ExternalImageDeleteEventHandlerTests()
        {
            amazonS3Service = Substitute.For<IAmazonS3ImageBucketService>();
            logger = Substitute.For<IAmazonS3Logger>();
            hotelReportService = Substitute.For<IHotelReportService>();
            externaImagesRepository = Substitute.For<IExternaImagesRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            settings = Substitute.For<IEnvironmentHintSettingsService>();
            eventHandler = new ExternalImageDeleteEventHandler(logger, amazonS3Service, hotelReportService, externaImagesRepository, databaseProvider, settings);
        }

        [Fact]
        public void OnItemDeleted_CatchException_IfServiceThrowException()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"));
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));
            amazonS3Service.When(x => x.DeleteImages(Arg.Any<ICollection<string>>())).Do(x => { throw new Exception(); });

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            hotelReportService.Received().Error(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<Exception>());
        }

        [Fact]
        public void OnItemDeleted_CatchException_IfImageWasNotDeleted()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"));
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            amazonS3Service.When(x => x.DeleteImages(Arg.Any<ICollection<string>>())).Do(x => { throw new ImageNotDeletedException("Error"); });
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            logger.ReceivedWithAnyArgs().Warn("Error", Arg.Any<ImageNotDeletedException>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemDeleted_Recived_IfAllowDeleteImagesFromS3IsFalse()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"));
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.FalseString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemDeleted_Recived_IfImageHasntDuplicatesAndDeleteingAllow()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"));
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemDeleted_DeletesFromS3_IfExternalImageContainsCode()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"), code: "HTL001");
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            amazonS3Service.Received().DeleteImages(Arg.Any<ICollection<string>>());
        }

        [Fact]
        public void OnItemDeleted_DeletesOriginalImage_FromOriginalFolder()
        {
            // Arrange
            var smallUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/small/photo.jpg";
            var mediumUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/medium/photo.jpg";
            var largeUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/large/photo.jpg";
            var expectedOriginalUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/Original/photo.jpg";
            var externalImage = CreateExternalImage(
                FakeUtil.FakeDatabase("master"),
                name: "External Image",
                smallUrl: smallUrl,
                mediumUrl: mediumUrl,
                largeUrl: largeUrl);
            var eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            amazonS3Service.Received().DeleteImages(Arg.Is<ICollection<string>>(paths =>
                paths.Contains(smallUrl)
                && paths.Contains(mediumUrl)
                && paths.Contains(largeUrl)
                && paths.Contains(expectedOriginalUrl)));
        }

        [Fact]
        public void OnItemDeleted_DeletesOriginalImage_FromOriginalFolder_WhenSmallFolderIsUppercase()
        {
            // Arrange
            var smallUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/SMALL/photo.jpg";
            var mediumUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/medium/photo.jpg";
            var largeUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/large/photo.jpg";
            var expectedOriginalUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/Original/photo.jpg";
            var externalImage = CreateExternalImage(
                FakeUtil.FakeDatabase("master"),
                name: "External Image",
                smallUrl: smallUrl,
                mediumUrl: mediumUrl,
                largeUrl: largeUrl);
            var eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            amazonS3Service.Received().DeleteImages(Arg.Is<ICollection<string>>(paths => paths.Contains(expectedOriginalUrl)));
        }

        [Fact]
        public void OnItemDeleted_DoesNotRewriteOriginalImage_WhenSmallPathIsNotAbsoluteUrl()
        {
            // Arrange
            var smallUrl = "hotel/SMALL/photo.jpg";
            var mediumUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/medium/photo.jpg";
            var largeUrl = "https://test-bucket.s3-eu-west-1.amazonaws.com/hotel/large/photo.jpg";
            var unexpectedOriginalUrl = "hotel/Original/photo.jpg";
            var externalImage = CreateExternalImage(
                FakeUtil.FakeDatabase("master"),
                name: "External Image",
                smallUrl: smallUrl,
                mediumUrl: mediumUrl,
                largeUrl: largeUrl);
            var eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(1, new BaseExternalImageSearchResultItem()));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            amazonS3Service.Received().DeleteImages(Arg.Is<ICollection<string>>(paths =>
                paths.Contains(smallUrl)
                && paths.Contains(mediumUrl)
                && paths.Contains(largeUrl)
                && !paths.Contains(unexpectedOriginalUrl)));
        }

        [Fact]
        public void OnItemDeleted_Recived_IfImageHasDuplicates()
        {
            // Arrange
            var externalImageItem = CreateExternalImage(FakeUtil.FakeDatabase("master"), name: "Image item", largeUrl: "Url1");
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImageItem }, new EventResult());
            var results = CreateSearchResults(
                2,
                new BaseExternalImageSearchResultItem
                {
                    Uri = externalImageItem.Uri,
                    LargeImageUrl = "Url1",
                });
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(results);

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemDeleted_Recived_IfImageWasNotFound()
        {
            // Arrange
            var externalImage = CreateExternalImage(FakeUtil.FakeDatabase("master"));
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { externalImage }, new EventResult());
            externaImagesRepository.GetDuplicates(Arg.Any<string>()).Returns(CreateSearchResults(0));

            using (new SettingsSwitcher("AmazonS3.AllowDeleteImagesFromS3", bool.TrueString))
            {
                // Act
                eventHandler.OnItemDeleted(null, eventArgs);
            }

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void OnItemDeleted_Recived_IfExternalImageEqualNull()
        {
            // Arrange
            SitecoreEventArgs eventArgs = new SitecoreEventArgs("OnDeleteEventTest", new object[] { null }, new EventResult());

            // Act
            eventHandler.OnItemDeleted(null, eventArgs);

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        private static SearchResults<BaseExternalImageSearchResultItem> CreateSearchResults(
            int totalSearchResults,
            params BaseExternalImageSearchResultItem[] items)
        {
            var hints = new List<SearchHit<BaseExternalImageSearchResultItem>>();
            foreach (var item in items)
            {
                hints.Add(new SearchHit<BaseExternalImageSearchResultItem>(1, item));
            }

            return new SearchResults<BaseExternalImageSearchResultItem>(hints, totalSearchResults);
        }

        private static Item CreateExternalImage(
            Sitecore.Data.Database database,
            string name = "Test External Image",
            string code = null,
            string smallUrl = null,
            string mediumUrl = null,
            string largeUrl = null)
        {
            return new FakeItem(ID.NewID, database)
                .WithTemplate(DestinationsConstants.TemplateIds.ExternalImage)
                .WithUri()
                .WithName(name)
                .WithField("Code", code)
                .WithField(DestinationsConstants.Fields.ExternalImageItem.Small, smallUrl)
                .WithField(DestinationsConstants.Fields.ExternalImageItem.Medium, mediumUrl)
                .WithField(DestinationsConstants.Fields.ExternalImageItem.Large, largeUrl)
                .ToSitecoreItem();
        }
    }
}
