using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using easyJet.Foundation.AmazonS3.Exceptions;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.AmazonS3.Services.Sync;
using easyJet.Foundation.AmazonS3.Tests.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Optimization.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Sitecore.Resources.Media;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.Services.Sync
{
    public class SyncDataServiceTests
    {
        private readonly IImageService imageService;
        private readonly IAmazonS3ImageBucketService amazonS3Service;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IAmazonS3Logger logger;
        private readonly IOptimizationImageService optimizationImageService;
        private readonly SyncDataService syncDataService;

        public SyncDataServiceTests()
        {
            imageService = Substitute.For<IImageService>();
            amazonS3Service = Substitute.For<IAmazonS3ImageBucketService>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            logger = Substitute.For<IAmazonS3Logger>();
            optimizationImageService = Substitute.For<IOptimizationImageService>();
            syncDataService = new SyncDataService(imageService, amazonS3Service, datasourceRepository, logger, optimizationImageService);
        }

        // GetImageFolder Tests
        [Fact]
        public void GetImageFolder_ShouldReturnHotelImageFolder_WhenHotelCodeEqualsImageCode()
        {
            // Arrange
            const string hotelCode = "TRAN0070";
            const string imageCode = "TRAN0070";
            const string imageName = "TRAN0070_01";

            var hotelItem = new FakeItem()
                .WithName("Test Hotel")
                .ToSitecoreItem();

            var imagesFolder = new FakeItem()
                .WithName("Images")
                .WithTemplate(DestinationsConstants.TemplateIds.ImagesFolder)
                .ToSitecoreItem();

            datasourceRepository.GetOrCreateItem(
                DestinationsConstants.Fields.AccommodationItem.Images,
                DestinationsConstants.TemplateIds.ImagesFolder,
                hotelItem).Returns(imagesFolder);

            // Act
            var result = syncDataService.GetImageFolder(hotelItem, imageCode, imageName, hotelCode);

            // Assert
            result.Should().Be(imagesFolder);
            datasourceRepository.Received(1).GetOrCreateItem(
                DestinationsConstants.Fields.AccommodationItem.Images,
                DestinationsConstants.TemplateIds.ImagesFolder,
                hotelItem);
        }

        [Fact]
        public void GetImageFolder_ShouldReturnHotelImageFolder_WhenHotelCodeEqualsImageCode_CaseInsensitive()
        {
            // Arrange
            const string hotelCode = "tran0070";
            const string imageCode = "TRAN0070";
            const string imageName = "TRAN0070_01";

            var hotelItem = new FakeItem()
                .WithName("Test Hotel")
                .ToSitecoreItem();

            var imagesFolder = new FakeItem()
                .WithName("Images")
                .WithTemplate(DestinationsConstants.TemplateIds.ImagesFolder)
                .ToSitecoreItem();

            datasourceRepository.GetOrCreateItem(
                DestinationsConstants.Fields.AccommodationItem.Images,
                DestinationsConstants.TemplateIds.ImagesFolder,
                hotelItem).Returns(imagesFolder);

            // Act
            var result = syncDataService.GetImageFolder(hotelItem, imageCode, imageName, hotelCode);

            // Assert
            result.Should().Be(imagesFolder);
        }

        // SyncImage with parentFolder Tests
        [Fact]
        public void SyncImage_WithParentFolder_ShouldThrowException_WhenParentFolderIsNull()
        {
            // Arrange
            var imageItem = new FakeItem()
                .WithName("TestImage")
                .ToSitecoreItem();
            const string hotelCode = "TRAN0070";

            // Act
            Action act = () => syncDataService.SyncImage(null, imageItem, hotelCode);

            // Assert
            act.Should().Throw<ImageSyncAbandonedException>()
                .WithMessage("*Parent folder is null*");
        }

        [Theory]
        [AutoDbData]
        public void SyncDataService_AddImageToHotel_IfHotelCodeEqualImageCode(Db db, MediaItem imageItem, DatasourceItemDbItem hotelItem)
        {
            // Arrange
            var mockAtcomCode = "ABCD0001";
            var imagesFolder = new DbItem("Image Folder", ID.NewID, DestinationsConstants.TemplateIds.ImagesFolder);
            db.Add(imagesFolder);
            var atcomRoomFolder = new DbItem("Rooms - DC", ID.NewID, DestinationsConstants.TemplateIds.AccommodationRoomsFolder);
            atcomRoomFolder.ParentID = hotelItem.ID;
            atcomRoomFolder.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Code, mockAtcomCode);
            db.Add(atcomRoomFolder);

            var externalImage = new DbItem("Image", ID.NewID, DestinationsConstants.TemplateIds.ExternalImage);
            externalImage.Fields.Add("image", "/");
            db.Add(externalImage);

            imageService.ResizeImage(Arg.Any<MediaItem>()).Returns(new List<Image>() { new Image(imageItem) });

            datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, db.GetItem(hotelItem.ID)).Returns(db.GetItem(imagesFolder.ID));
            datasourceRepository.GetOrCreateItem(imageItem.Name, DestinationsConstants.TemplateIds.ExternalImage, db.GetItem(imagesFolder.ID)).Returns(db.GetItem(externalImage.ID));

            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>()
            {
                { "image", "url" }
            });

            // Act
            syncDataService.SyncImage(db.GetItem(hotelItem.ID), imageItem, mockAtcomCode, mockAtcomCode);

            // Assert
            datasourceRepository.ReceivedWithAnyArgs().GetOrCreateItem(imageItem.Name, DestinationsConstants.TemplateIds.ExternalImage, db.GetItem(imagesFolder.ID));
        }

        [Theory]
        [AutoDbData]
        public void SyncDataService_AddImageToHotel_IfHotelCodeNotEqualImageCode(Db db, MediaItem imageItem, DatasourceItemDbItem hotelItem, string hotelCode, string imageCode)
        {
            // Arrange
            var roomsFolder = new DbItem("Rooms Folder", ID.NewID, DestinationsConstants.TemplateIds.AccommodationRoomsFolder);
            roomsFolder.Fields.Add("Code", hotelCode);
            hotelItem.Children.Add(roomsFolder);
            db.Add(roomsFolder);

            var type = new DbItem("Test Type");
            type.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Code, imageCode);
            db.Add(type);

            var room = new DbItem("Test Room", ID.NewID, DestinationsConstants.TemplateIds.AccommodationRoom);
            room.Fields.Add(DestinationsConstants.Fields.AccommodationRoomItem.RoomType, type.ID.ToString());
            roomsFolder.Children.Add(room);
            db.Add(room);

            var imagesFolder = new DbItem("Image Folder", ID.NewID, DestinationsConstants.TemplateIds.ImagesFolder);
            db.Add(imagesFolder);

            var externalImage = new DbItem("Image", ID.NewID, DestinationsConstants.TemplateIds.ExternalImage);
            externalImage.Fields.Add("image", "/");
            db.Add(externalImage);

            imageService.ResizeImage(Arg.Any<MediaItem>()).Returns(new List<Image>() { new Image(imageItem) });

            datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, db.GetItem(hotelItem.ID)).Returns(db.GetItem(imagesFolder.ID));
            datasourceRepository.GetOrCreateItem(imageItem.Name, DestinationsConstants.TemplateIds.ExternalImage, db.GetItem(imagesFolder.ID)).Returns(db.GetItem(externalImage.ID));
            datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, db.GetItem(room.ID)).Returns(db.GetItem(imagesFolder.ID));

            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>()
                {
                    { "image", "url" }
                });
            // Act
            syncDataService.SyncImage(db.GetItem(hotelItem.ID), imageItem, imageCode, hotelCode);
            // Assert
            datasourceRepository.ReceivedWithAnyArgs().GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, db.GetItem(room.ID));
        }

        [Theory]
        [AutoDbData]
        public void SyncDataService_CatchException_IfRoomFolderEqualNull(Db db, MediaItem imageItem, DatasourceItemDbItem hotelItem, string imageCode, string hotelCode)
        {
            // Act
            Action actual = () => syncDataService.SyncImage(db.GetItem(hotelItem.ID), imageItem, imageCode, hotelCode);

            // Assert
            actual.Should().Throw<ImageSyncAbandonedException>();
        }

        [Theory]
        [AutoDbData]
        public void SyncDataService_GetHotelRoomImageFolderReturnNull_IfRoomsFolderDontHasChildren(Db db, MediaItem imageItem, DatasourceItemDbItem hotelItem, string imageCode, string hotelCode)
        {
            // Arrange
            var roomsFolder = new DbItem("Rooms Folder", ID.NewID, DestinationsConstants.TemplateIds.AccommodationRoomsFolder);
            hotelItem.Children.Add(roomsFolder);
            roomsFolder.Fields.Add("Code", hotelCode);
            db.Add(roomsFolder);

            var imagesFolder = new DbItem("Image Folder", ID.NewID, DestinationsConstants.TemplateIds.ImagesFolder);
            db.Add(imagesFolder);

            var externalImage = new DbItem("Image", ID.NewID, DestinationsConstants.TemplateIds.ExternalImage);
            externalImage.Fields.Add("image", "/");
            db.Add(externalImage);

            imageService.ResizeImage(Arg.Any<MediaItem>()).Returns(new List<Image>() { new Image(imageItem) });

            datasourceRepository.GetOrCreateItem(DestinationsConstants.Fields.AccommodationItem.Images, DestinationsConstants.TemplateIds.ImagesFolder, db.GetItem(hotelItem.ID)).Returns(db.GetItem(imagesFolder.ID));
            datasourceRepository.GetOrCreateItem(imageItem.Name, DestinationsConstants.TemplateIds.ExternalImage, db.GetItem(imagesFolder.ID)).Returns(db.GetItem(externalImage.ID));

            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>()
                {
                    { "image", "url" }
                });
            // Act
            Action actual = () => syncDataService.SyncImage(db.GetItem(hotelItem.ID), imageItem, imageCode, hotelCode);
            // Assert
            actual.Should().Throw<ImageSyncAbandonedException>();
        }

        [Fact]
        public void SyncImage_WithKeepOriginal_ShouldUploadOriginalImageToOriginalFolder()
        {
            // Arrange
            const string imageName = "sample";
            var parentFolder = new FakeItem().WithName("Images").ToSitecoreItem();
            var imageItem = new MediaItem(new FakeItem().WithName(imageName).ToSitecoreItem());

            imageService
                .ResizeImage(Arg.Any<MediaItem>())
                .Returns(new List<Image>
                {
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Small, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 1 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Medium, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 2 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Large, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 3 }), ContentType = "image/jpeg" }
                });
            optimizationImageService
                .Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                .Returns(callInfo => ((MediaStream)callInfo[0]).Stream);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns((Item)null);
            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>());

            // Act
            syncDataService.SyncImage(parentFolder, imageItem, "HOTEL", true);

            // Assert
            imageService.Received(1).ResizeImage(Arg.Any<MediaItem>());
            optimizationImageService.Received(3).Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
            amazonS3Service.Received(1).UploadImages(Arg.Is<ICollection<Image>>(images =>
                images.Count == 3 &&
                images.Count(image => image.Version == DestinationsConstants.Fields.ExternalImageItem.Small) == 1 &&
                images.Count(image => image.Version == DestinationsConstants.Fields.ExternalImageItem.Medium) == 1 &&
                images.Count(image => image.Version == DestinationsConstants.Fields.ExternalImageItem.Large) == 1));
            amazonS3Service.DidNotReceiveWithAnyArgs().UploadImage(default, default, default);
        }

        [Fact]
        public void SyncImage_WithoutKeepOriginal_ShouldNotUploadOriginalImage()
        {
            // Arrange
            const string imageName = "sample";
            var parentFolder = new FakeItem().WithName("Images").ToSitecoreItem();
            var imageItem = new MediaItem(new FakeItem().WithName(imageName).ToSitecoreItem());

            imageService
                .ResizeImage(Arg.Any<MediaItem>())
                .Returns(new List<Image>
                {
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Small, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 1 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Medium, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 2 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Large, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 3 }), ContentType = "image/jpeg" }
                });
            optimizationImageService
                .Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                .Returns(callInfo => ((MediaStream)callInfo[0]).Stream);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns((Item)null);
            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>());

            // Act
            syncDataService.SyncImage(parentFolder, imageItem, "HOTEL");

            // Assert
            imageService.Received(1).ResizeImage(Arg.Any<MediaItem>());
            optimizationImageService.Received(3).Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
            amazonS3Service.DidNotReceiveWithAnyArgs().UploadImage(default, default, default);
        }

        [Fact]
        public void SyncImage_WithKeepOriginal_ShouldSkipOriginalUpload_WhenOriginalStreamMissing()
        {
            // Arrange
            const string imageName = "sample";
            var parentFolder = new FakeItem().WithName("Images").ToSitecoreItem();
            var imageItem = new MediaItem(new FakeItem().WithName(imageName).ToSitecoreItem());

            imageService
                .ResizeImage(Arg.Any<MediaItem>())
                .Returns(new List<Image>
                {
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Small, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 1 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Medium, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 2 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Large, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 3 }), ContentType = "image/jpeg" }
                });
            optimizationImageService
                .Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                .Returns(callInfo => ((MediaStream)callInfo[0]).Stream);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns((Item)null);
            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>());

            // Act
            syncDataService.SyncImage(parentFolder, imageItem, "HOTEL", true);

            // Assert
            amazonS3Service.DidNotReceiveWithAnyArgs().UploadImage(default, default, default);
            amazonS3Service.Received(1).UploadImages(Arg.Any<ICollection<Image>>());
        }

        [Fact]
        public void UploadOriginalImageIfRequired_ShouldUploadOriginalImage_WithParentInKey()
        {
            // Arrange
            using (var stream = new MemoryStream(new byte[] { 9, 8, 7 }))
            {
                stream.Position = stream.Length;
                const string parentName = "Room123";
                const string imageName = "sample";
                var parentItem = new FakeItem().WithName(parentName);
                var sitecoreItem = new FakeItem()
                    .WithName(imageName)
                    .WithParent(parentItem)
                    .WithField("Extension", "jpg")
                    .WithField("Mime Type", "image/jpeg")
                    .ToSitecoreItem();
                var mediaItem = new MediaItem(sitecoreItem);
                var service = new TestSyncDataService(
                    imageService, amazonS3Service, datasourceRepository, logger, optimizationImageService, stream);

                // Act
                InvokeUploadOriginalImageIfRequired(service, mediaItem, true);

                // Assert
                amazonS3Service.Received(1).UploadImage(
                    Arg.Any<Stream>(),
                    $"{parentName}/{Constants.ImageNames.OriginalImageFolder}/{imageName}.jpg",
                    "image/jpeg");
            }
        }

        [Fact]
        public void BuildOriginalImageKey_ShouldIncludeParentFolder_WhenParentExists()
        {
            // Arrange
            const string parentName = "Room456";
            const string imageName = "sample-parent";
            var parentItem = new FakeItem().WithName(parentName);
            var mediaItem = new MediaItem(new FakeItem()
                .WithName(imageName)
                .WithParent(parentItem)
                .WithField("Extension", "png")
                .ToSitecoreItem());

            // Act
            var result = InvokeBuildOriginalImageKey(mediaItem);

            // Assert
            result.Should().Be($"{parentName}/{Constants.ImageNames.OriginalImageFolder}/{imageName}.png");
        }

        [Fact]
        public void BuildOriginalImageKey_ShouldUseOriginalFolderOnly_WhenParentMissing()
        {
            // Arrange
            const string imageName = "sample-root";
            var mediaItem = new MediaItem(new FakeItem()
                .WithName(imageName)
                .WithField("Extension", "gif")
                .ToSitecoreItem());

            // Act
            var result = InvokeBuildOriginalImageKey(mediaItem);

            // Assert
            result.Should().Be($"{Constants.ImageNames.OriginalImageFolder}/{imageName}.gif");
        }

        [Fact]
        public void UploadOriginalImageIfRequired_ShouldNotUpload_WhenMediaItemIsNull()
        {
            // Act
            InvokeUploadOriginalImageIfRequired(syncDataService, null, true);

            // Assert
            amazonS3Service.DidNotReceiveWithAnyArgs().UploadImage(default, default, default);
        }

        [Fact]
        public void UploadOriginalImageIfRequired_ShouldUploadToOriginalFolderRoot_WhenParentMissing()
        {
            // Arrange
            using (var stream = new MemoryStream(new byte[] { 1, 9, 1 }))
            {
                const string imageName = "sample-root-upload";
                var sitecoreItem = new FakeItem()
                    .WithName(imageName)
                    .WithField("Extension", "webp")
                    .WithField("Mime Type", "image/webp")
                    .ToSitecoreItem();
                var mediaItem = new MediaItem(sitecoreItem);
                var service = new TestSyncDataService(
                    imageService, amazonS3Service, datasourceRepository, logger, optimizationImageService, stream);

                // Act
                InvokeUploadOriginalImageIfRequired(service, mediaItem, true);

                // Assert
                amazonS3Service.Received(1).UploadImage(
                    Arg.Any<Stream>(),
                    $"{Constants.ImageNames.OriginalImageFolder}/{imageName}.webp",
                    Arg.Any<string>());
            }
        }

        [Fact]
        public void SyncImage_ShouldOptimizeOnlyImagesWithStreams()
        {
            // Arrange
            const string imageName = "sample-mixed-streams";
            var parentFolder = new FakeItem().WithName("Images").ToSitecoreItem();
            var imageItem = new MediaItem(new FakeItem().WithName(imageName).ToSitecoreItem());

            imageService
                .ResizeImage(Arg.Any<MediaItem>())
                .Returns(new List<Image>
                {
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Small, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 1 }), ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Medium, MediaItem = imageItem, Stream = null, ContentType = "image/jpeg" },
                    new Image { Version = DestinationsConstants.Fields.ExternalImageItem.Large, MediaItem = imageItem, Stream = new MemoryStream(new byte[] { 3 }), ContentType = "image/jpeg" }
                });
            optimizationImageService
                .Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>())
                .Returns(callInfo => ((MediaStream)callInfo[0]).Stream);
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns((Item)null);
            amazonS3Service.UploadImages(Arg.Any<ICollection<Image>>()).Returns(new Dictionary<string, string>());

            // Act
            syncDataService.SyncImage(parentFolder, imageItem, "HOTEL");

            // Assert
            optimizationImageService.Received(2).Optimize(Arg.Any<MediaStream>(), Arg.Any<MediaOptions>());
            amazonS3Service.Received(1).UploadImages(Arg.Any<ICollection<Image>>());
        }

        private static string InvokeBuildOriginalImageKey(MediaItem mediaItem)
        {
            var method = typeof(SyncDataService).GetMethod("BuildOriginalImageKey", BindingFlags.NonPublic | BindingFlags.Static);
            return (string)method.Invoke(null, new object[] { mediaItem });
        }

        private static void InvokeUploadOriginalImageIfRequired(SyncDataService service, MediaItem mediaItem, bool keepOriginal)
        {
            var method = typeof(SyncDataService).GetMethod("UploadOriginalImageIfRequired", BindingFlags.NonPublic | BindingFlags.Instance);
            method.Invoke(service, new object[] { mediaItem, keepOriginal });
        }

        private sealed class TestSyncDataService : SyncDataService
        {
            private readonly Stream blobStream;

            public TestSyncDataService(
                IImageService imageService,
                IAmazonS3ImageBucketService amazonS3Service,
                IDatasourceRepository datasourceRepository,
                IAmazonS3Logger logger,
                IOptimizationImageService optimizationImageService,
                Stream blobStream)
                : base(imageService, amazonS3Service, datasourceRepository, logger, optimizationImageService)
            {
                this.blobStream = blobStream;
            }

            protected override Stream GetOriginalBlobStream(MediaItem mediaItem) => blobStream;
        }
    }
}
