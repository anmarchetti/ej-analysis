using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.HotelBeds.Tests.FakeDb;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Indexing;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Sitecore;
using Sitecore.Collections;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.SecurityModel;
using Sitecore.Sites;
using Xunit;
using Accommodation = easyJet.Foundation.HotelBeds.Models.Domain.Accommodation;
using IMasterDataService = easyJet.Foundation.HotelBeds.Services.IMasterDataService;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.HotelBeds.Tests.Services
{
    public class SyncDataServiceTests
    {
        private readonly IMasterDataService masterDataService;
        private readonly IDatasourceRepository dataSourceRepository;
        private readonly ISearchDatasourceRepository searchRepository;
        private readonly IHotelBedsLogger logger;
        private readonly IImagesService imagesService;
        private readonly ICustomCacheRepository cacheRepository;
        private readonly IIntegrationService integrationService;
        private readonly IIndexingService indexingService;
        private readonly SyncDataService sut;

        private readonly Fixture fixture;
        private readonly IDatabaseProvider databaseProvider;
        private readonly ISimpleCacheService simpleCache;
        private readonly IAmazonS3ImageBucketService s3ImageBucketService;
        private readonly IHttpClientProvider httpClientProvider;

        public SyncDataServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            dataSourceRepository = Substitute.For<IDatasourceRepository>();
            searchRepository = Substitute.For<ISearchDatasourceRepository>();
            logger = Substitute.For<IHotelBedsLogger>();
            cacheRepository = Substitute.For<ICustomCacheRepository>();
            imagesService = Substitute.For<IImagesService>();
            integrationService = Substitute.For<IIntegrationService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            simpleCache = Substitute.For<ISimpleCacheService>();
            indexingService = Substitute.For<IIndexingService>();

            s3ImageBucketService = Substitute.For<IAmazonS3ImageBucketService>();
            httpClientProvider = Substitute.For<IHttpClientProvider>();
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "false"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                sut = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);
            }

            fixture = new Fixture();
        }

        [Fact]
        public void DownloadFromHbAndUploadToS3_ShouldCallUploadImage_WithExpectedKeyAndContentType()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                return response;
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns("https://s3.example.com/18692/large/img.jpg");

            // Act
            var result = InvokeDownloadFromHbAndUploadToS3("Large", "https://photos.hotelbeds.com/fake.jpg", "18692", "img.jpg");

            // Assert
            result.Should().Be("https://s3.example.com/18692/large/img.jpg");
            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "hbg/18692/large/img.jpg", "image/png");
        }

        [Fact]
        public void DownloadFromHbAndUploadToS3_ShouldReturnNull_AndNotUpload_WhenSourceReturnsForbidden()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("forbidden")
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));

            // Act
            var result = InvokeDownloadFromHbAndUploadToS3("Large", "https://photos.hotelbeds.com/fake.jpg", "18692", "img.jpg");

            // Assert
            result.Should().BeNull();
            s3ImageBucketService.DidNotReceive().UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public void DownloadFromHbAndUploadToS3_ShouldLogWarning_WhenSourceReturnsForbidden()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("forbidden")
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));

            // Act
            _ = InvokeDownloadFromHbAndUploadToS3("Large", "https://photos.hotelbeds.com/fake.jpg", "18692", "img.jpg");

            // Assert
            logger.Received(1).Warn(
                Arg.Is<string>(m => m.Contains("Failed to download source image") && m.Contains("Status:403")),
                Arg.Any<object>());
        }

        [Fact]
        public void DownloadFromHbAndUploadToS3_ShouldUseJpegContentType_WhenSourceContentTypeIsMissing()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns("https://s3.example.com/18692/large/img.jpg");

            // Act
            var result = InvokeDownloadFromHbAndUploadToS3("Large", "https://photos.hotelbeds.com/fake.jpg", "18692", "img.jpg");

            // Assert
            result.Should().Be("https://s3.example.com/18692/large/img.jpg");
            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "hbg/18692/large/img.jpg", "image/jpeg");
        }

        [Fact]
        public void SyncImageToAmazonS3_ShouldThrowArgumentNullException_WhenImageIsNull()
        {
            // Act
            Action action = () => InvokeSyncImageToAmazonS3(null, "18692");

            // Assert
            action.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("image");
        }

        [Fact]
        public void SyncImageToAmazonS3_ShouldThrowArgumentNullException_WhenHotelCodeIsMissing()
        {
            // Act
            Action action = () => InvokeSyncImageToAmazonS3(new Image(), " ");

            // Assert
            action.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("hotelCode");
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldThrowArgumentNullException_WhenHotelCodeIsMissing()
        {
            // Act
            Action action = () => sut.SyncImageUrlsToAmazonS3(
                " ",
                new Dictionary<string, string> { { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/fake.jpg" } },
                "img.jpg",
                out _);

            // Assert
            action.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("hotelCode");
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldThrowArgumentNullException_WhenImageUrlsByFieldIsNull()
        {
            // Act
            Action action = () => sut.SyncImageUrlsToAmazonS3("18692", null, "img.jpg", out _);

            // Assert
            action.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("imageUrlsByField");
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldStripCacheBusterSuffixFromS3Key_WhenImageNameContainsQueryString()
        {
            // Arrange
            // HotelBeds appends cache-busting timestamps to source URLs (e.g. "foo.jpg?20250319094242?20250413090254").
            // If those characters end up in the S3 object key, any HTTP client treats the first '?' as the start
            // of the query string, so the stored object can never be retrieved (S3 returns AccessDenied).
            var handler = new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                return response;
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns("https://s3.example.com/uploaded.jpg");

            var imageUrls = new Dictionary<string, string>
            {
                { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/giata/09/091470/091470a_hb_ba_010.jpg?20250319094242?20250413090254?20250702110316" }
            };

            // Act
            sut.SyncImageUrlsToAmazonS3("91470", imageUrls, "091470a_hb_ba_010.jpg?20250319094242?20250413090254?20250702110316", out _);

            // Assert
            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "hbg/91470/small/091470a_hb_ba_010.jpg", "image/jpeg");
            s3ImageBucketService.DidNotReceive().UploadImage(Arg.Any<Stream>(), Arg.Is<string>(k => k.Contains("?")), Arg.Any<string>());
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldUploadAllImages_WithCustomPrefix()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                return response;
            });

            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns(callInfo => $"https://s3.example.com/{callInfo.ArgAt<string>(1)}");

            var imageUrls = new Dictionary<string, string>
            {
                { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/small/source.jpg" },
                { Destinations.Constants.Fields.ExternalImageItem.Medium, "https://photos.hotelbeds.com/medium/source.jpg" },
                { Destinations.Constants.Fields.ExternalImageItem.Large, "https://photos.hotelbeds.com/large/source.jpg" }
            };

            // Act
            var result = sut.SyncImageUrlsToAmazonS3("18692", imageUrls, "img.jpg", out var errorsByField, "custom/prefix");

            // Assert
            result.Should().NotBeNull();
            result[Destinations.Constants.Fields.ExternalImageItem.Small].Should().Be("https://s3.example.com/custom/prefix/18692/small/img.jpg");
            result[Destinations.Constants.Fields.ExternalImageItem.Medium].Should().Be("https://s3.example.com/custom/prefix/18692/medium/img.jpg");
            result[Destinations.Constants.Fields.ExternalImageItem.Large].Should().Be("https://s3.example.com/custom/prefix/18692/large/img.jpg");
            errorsByField.Should().BeEmpty();

            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "custom/prefix/18692/small/img.jpg", "image/png");
            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "custom/prefix/18692/medium/img.jpg", "image/png");
            s3ImageBucketService.Received(1).UploadImage(Arg.Any<Stream>(), "custom/prefix/18692/large/img.jpg", "image/png");
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldLogSuccessDebug_WhenUploadSucceeds()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns("https://s3.example.com/hbg/18692/small/img.jpg");

            // Act
            _ = sut.SyncImageUrlsToAmazonS3(
                "18692",
                new Dictionary<string, string> { { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/small/source.jpg" } },
                "img.jpg",
                out _);

            // Assert
            logger.Received().Debug(
                Arg.Is<string>(m => m.Contains("S3 sync succeeded") && m.Contains("size:Small")),
                Arg.Any<object>());
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldLogEmptyUrlDebug_WhenUploadFails()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("forbidden")
            });
            httpClientProvider.GetClient().Returns(new HttpClient(handler));

            // Act
            _ = sut.SyncImageUrlsToAmazonS3(
                "18692",
                new Dictionary<string, string> { { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/small/source.jpg" } },
                "img.jpg",
                out _);

            // Assert
            logger.Received().Debug(
                Arg.Is<string>(m => m.Contains("S3 sync returned empty URL") && m.Contains("size:Small")),
                Arg.Any<object>());
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldGenerateDefaultImageName_WhenImageNameIsMissing()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                return response;
            });

            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns(callInfo => $"https://s3.example.com/{callInfo.ArgAt<string>(1)}");

            var imageUrls = new Dictionary<string, string>
            {
                { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/small/source.jpg" }
            };

            // Act
            var result = sut.SyncImageUrlsToAmazonS3("18692", imageUrls, null, out var errorsByField);

            // Assert
            result.Should().ContainKey(Destinations.Constants.Fields.ExternalImageItem.Small);
            result[Destinations.Constants.Fields.ExternalImageItem.Small]
                .Should()
                .MatchRegex(@"^https://s3\.example\.com/hbg/18692/small/[a-f0-9]{32}\.jpg$");
            errorsByField.Should().BeEmpty();
        }

        [Fact]
        public void SyncImageUrlsToAmazonS3_ShouldCollectErrors_ForFailedFields()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(request =>
            {
                if (request.RequestUri.AbsoluteUri.Contains("/medium/"))
                {
                    return new HttpResponseMessage(HttpStatusCode.Forbidden)
                    {
                        Content = new StringContent("forbidden")
                    };
                }

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                return response;
            });

            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns(callInfo => $"https://s3.example.com/{callInfo.ArgAt<string>(1)}");

            var imageUrls = new Dictionary<string, string>
            {
                { Destinations.Constants.Fields.ExternalImageItem.Small, "https://photos.hotelbeds.com/small/source.jpg" },
                { Destinations.Constants.Fields.ExternalImageItem.Medium, "https://photos.hotelbeds.com/medium/source.jpg" },
                { Destinations.Constants.Fields.ExternalImageItem.Large, "https://photos.hotelbeds.com/large/source.jpg" }
            };

            // Act
            var result = sut.SyncImageUrlsToAmazonS3("18692", imageUrls, "img.jpg", out var errorsByField);

            // Assert
            result[Destinations.Constants.Fields.ExternalImageItem.Small].Should().NotBeNull();
            result[Destinations.Constants.Fields.ExternalImageItem.Medium].Should().BeNull();
            result[Destinations.Constants.Fields.ExternalImageItem.Large].Should().NotBeNull();

            errorsByField.Should().ContainKey(Destinations.Constants.Fields.ExternalImageItem.Medium);
            errorsByField[Destinations.Constants.Fields.ExternalImageItem.Medium].Should().Contain("HTTP 403");
            errorsByField.Should().NotContainKey(Destinations.Constants.Fields.ExternalImageItem.Small);
            errorsByField.Should().NotContainKey(Destinations.Constants.Fields.ExternalImageItem.Large);
        }

        [Fact]
        public void GetImageUrls_ShouldReturnNullUrls_WhenHotelCodeIsMissing()
        {
            // Arrange
            var image = new Image { SrcUrl = "x.jpg" };

            // Act
            var (smallUrl, mediumUrl, largeUrl) = InvokeGetImageUrls(" ", image, "image-name");

            // Assert
            smallUrl.Should().BeNull();
            mediumUrl.Should().BeNull();
            largeUrl.Should().BeNull();
        }

        [Fact]
        public void GetImageUrls_ShouldMapOnlyNonEmptyS3Urls()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                return response;
            });

            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns(" ", "https://s3.example.com/18692/medium/img.jpg", null);

            var image = new Image
            {
                SrcUrl = "img.jpg",
            };

            // Act
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Small", "https://photos.hotelbeds.com/small/"))
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Medium", "https://photos.hotelbeds.com/medium/"))
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Large", "https://photos.hotelbeds.com/large/"))
            {
                var (smallUrl, mediumUrl, largeUrl) = InvokeGetImageUrls("18692", image, "image-name");

                // Assert
                smallUrl.Should().BeNull();
                mediumUrl.Should().Be("https://s3.example.com/18692/medium/img.jpg");
                largeUrl.Should().BeNull();
            }
        }

        [Fact]
        public void GetImageUrls_ShouldReturnNullUrls_AndLogWarning_WhenHttpRequestFails()
        {
            // Arrange
            var handler = new StubHttpMessageHandler(_ => throw new HttpRequestException("connection failed"));
            httpClientProvider.GetClient().Returns(new HttpClient(handler));
            var image = new Image { SrcUrl = "x.jpg" };

            // Act
            var (smallUrl, mediumUrl, largeUrl) = InvokeGetImageUrls("18692", image, "image-name");

            // Assert
            smallUrl.Should().BeNull();
            mediumUrl.Should().BeNull();
            largeUrl.Should().BeNull();
            logger.Received(1).Warn(Arg.Is<string>(m => m.Contains("Existing image URLs may be preserved")), Arg.Any<object>());
        }

        [Theory]
        [InlineData(null, null, null, false)]
        [InlineData("", " ", null, false)]
        [InlineData(null, "https://s3/medium.jpg", null, true)]
        public void HasAnyImageUrl_ShouldReturnExpectedValue(string smallUrl, string mediumUrl, string largeUrl, bool expected)
        {
            // Act
            var actual = InvokeHasAnyImageUrl(smallUrl, mediumUrl, largeUrl);

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void BuildImageChanges_ShouldMapUrlsAndUseRoomCode()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "TYP", RoomCode = "ROOM-999" };
            const string smallUrl = "https://s3/small.jpg";
            const string mediumUrl = "https://s3/medium.jpg";
            const string largeUrl = "https://s3/large.jpg";

            // Act
            var result = InvokeBuildImageChanges(image, smallUrl, mediumUrl, largeUrl);

            // Assert
            result[Destinations.Constants.Fields.ExternalImageItem.Small].Should().Be(smallUrl);
            result[Destinations.Constants.Fields.ExternalImageItem.Medium].Should().Be(mediumUrl);
            result[Destinations.Constants.Fields.ExternalImageItem.Large].Should().Be(largeUrl);
            result[Destinations.Constants.Fields.DatasourceItem.Code].Should().Be("ROOM-999");
        }

        [Fact]
        public void BuildImageChanges_ShouldNotContainImageSizeFields_WhenResolvedUrlsAreEmpty()
        {
            // Arrange
            var image = new Image { RoomCode = "ROOM-123" };

            // Act
            var result = InvokeBuildImageChanges(image, null, " ", string.Empty);

            // Assert
            result.Should().ContainKey(Destinations.Constants.Fields.DatasourceItem.Code);
            result.Should().NotContainKey(Destinations.Constants.Fields.ExternalImageItem.Small);
            result.Should().NotContainKey(Destinations.Constants.Fields.ExternalImageItem.Medium);
            result.Should().NotContainKey(Destinations.Constants.Fields.ExternalImageItem.Large);
        }

        [Fact]
        public void BuildImageChanges_ShouldFallBackToTypeCode_WhenRoomCodeIsEmpty()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "PIS", RoomCode = null };

            // Act
            var result = InvokeBuildImageChanges(image, "https://s3/small.jpg", "https://s3/medium.jpg", "https://s3/large.jpg");

            // Assert
            result[Destinations.Constants.Fields.DatasourceItem.Code].Should().Be("PIS");
        }

        [Fact]
        public void BuildImageChanges_ShouldPreferRoomCode_WhenBothRoomCodeAndTypeCodeExist()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "HAB", RoomCode = "DBLDXGV" };

            // Act
            var result = InvokeBuildImageChanges(image, "https://s3/small.jpg", "https://s3/medium.jpg", "https://s3/large.jpg");

            // Assert
            result[Destinations.Constants.Fields.DatasourceItem.Code].Should().Be("DBLDXGV");
        }

        [Fact]
        public void BuildImageChanges_ShouldNotContainCodeField_WhenBothRoomCodeAndTypeCodeAreEmpty()
        {
            // Arrange
            var image = new Image { ImageTypeСode = null, RoomCode = null };

            // Act
            var result = InvokeBuildImageChanges(image, "https://s3/small.jpg", "https://s3/medium.jpg", "https://s3/large.jpg");

            // Assert
            result.Should().NotContainKey(Destinations.Constants.Fields.DatasourceItem.Code);
        }

        [Fact]
        public void GetImageName_ShouldPreferRoomCode_WhenBothRoomCodeAndTypeCodeExist()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "HAB", RoomCode = "DBL.SU", Order = "23" };

            // Act
            var result = InvokeGetImageName(image);

            // Assert
            // RoomCode is preferred and the result is a Sitecore-valid item name (matches what Sitecore would
            // store when creating the item). Comparing against ProposeValidItemName makes the test robust to
            // environments that strip different invalid characters (e.g. dots).
            result.Should().Be(ItemUtil.ProposeValidItemName("DBL.SU-23"));
        }

        [Fact]
        public void GetImageName_ShouldSanitizeInvalidItemNameCharacters()
        {
            // Arrange
            // '<' is invalid in any Sitecore item name configuration, so the helper must strip it; otherwise
            // name-based lookups during subsequent syncs would never match the stored item.
            var image = new Image { RoomCode = "DBL<SU", Order = "23" };

            // Act
            var result = InvokeGetImageName(image);

            // Assert
            result.Should().Be(ItemUtil.ProposeValidItemName("DBL<SU-23"));
            result.Should().NotContain("<");
        }

        [Fact]
        public void GetImageName_ShouldFallBackToTypeCode_WhenRoomCodeIsEmpty()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "HAB", RoomCode = null, Order = "23" };

            // Act
            var result = InvokeGetImageName(image);

            // Assert
            result.Should().Be("HAB-23");
        }

        [Fact]
        public void GetImageName_ShouldReturnSanitizedOrder_WhenBothRoomCodeAndTypeCodeAreEmpty()
        {
            // Arrange
            var image = new Image { ImageTypeСode = null, RoomCode = null, Order = "5" };

            // Act
            var result = InvokeGetImageName(image);

            // Assert
            // With both codes empty the raw name is "-5"; Sitecore sanitization trims the leading dash so the
            // helper returns whatever ProposeValidItemName produces for the current configuration.
            result.Should().Be(ItemUtil.ProposeValidItemName("-5"));
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldSkip_WhenNoExistingImageAndNoUrls()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "HBG", Order = "1" };
            var accommodationImages = new List<Item>();
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            var result = InvokePrepareImageForUpdate(image, string.Empty, true, accommodationImages, imagesFolder);

            // Assert
            result.shouldUpdate.Should().BeFalse();
            result.imageItem.Should().BeNull();
            result.isNewImage.Should().BeFalse();
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldUseExistingItem_WhenUrlsMissing()
        {
            // Arrange
            var image = new Image { ImageTypeСode = "HBG", Order = "2" };
            var existing = new FakeItem().WithName("HBG-2").ToSitecoreItem();
            var accommodationImages = new List<Item> { existing };
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            var result = InvokePrepareImageForUpdate(image, string.Empty, false, accommodationImages, imagesFolder);

            // Assert
            result.shouldUpdate.Should().BeTrue();
            result.imageItem.Should().Be(existing);
            result.isNewImage.Should().BeFalse();
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldNotUpdate_WhenAddNewIsFalseAndNoExistingItem()
        {
            // Arrange
            var image = new Image
            {
                ImageTypeСode = "HBG",
                Order = "3",
                SrcUrl = "source.jpg"
            };

            httpClientProvider.GetClient().Returns(new HttpClient(new StubHttpMessageHandler(_ =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(Encoding.UTF8.GetBytes("fake-image-content"))
                };
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");
                return response;
            })));

            s3ImageBucketService
                .UploadImage(Arg.Any<Stream>(), Arg.Any<string>(), Arg.Any<string>())
                .Returns("https://s3.example.com/hbg/18692/small/source.jpg");

            var accommodationImages = new List<Item>();
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            (bool shouldUpdate, Item imageItem, bool isNewImage, string smallUrl, string mediumUrl, string largeUrl) result;
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Small", "https://photos.hotelbeds.com/small/"))
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Medium", "https://photos.hotelbeds.com/medium/"))
            using (new SettingsSwitcher("HotelBeds.ImageSizePrefixUrl.Large", "https://photos.hotelbeds.com/large/"))
            {
                result = InvokePrepareImageForUpdate(image, "18692", false, accommodationImages, imagesFolder);
            }

            // Assert
            result.shouldUpdate.Should().BeFalse();
            result.imageItem.Should().BeNull();
            result.isNewImage.Should().BeFalse();
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldAdoptExistingItem_ByLegacyName_WhenRoomCodeChangesNamingScheme()
        {
            // Arrange
            // Pre-WP-XXX items were named "{TypeCode}-{Order}" (e.g. "HAB-23"); after the rename to use RoomCode the
            // expected name is "DBL.SU-23". The existing legacy item should be adopted instead of recreated.
            var image = new Image { ImageTypeСode = "HAB", RoomCode = "DBL.SU", Order = "23" };
            var legacyItem = new FakeItem().WithName("HAB-23").ToSitecoreItem();
            var accommodationImages = new List<Item> { legacyItem };
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            var result = InvokePrepareImageForUpdate(image, string.Empty, true, accommodationImages, imagesFolder);

            // Assert
            result.shouldUpdate.Should().BeTrue();
            result.imageItem.Should().Be(legacyItem);
            result.isNewImage.Should().BeFalse();
            dataSourceRepository
                .DidNotReceive()
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>());
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldAdoptExistingItem_ByCodeField_WhenNamesDoNotMatchButCodeAndOrderDo()
        {
            // Arrange
            // Item was renamed manually so neither the new nor the legacy name match, but the Code field still
            // holds the resolved code and the name retains the order suffix. Sync should adopt rather than
            // create a duplicate.
            var image = new Image { ImageTypeСode = "HAB", RoomCode = "DBL.SU", Order = "23" };
            var renamedItem = new FakeItem()
                .WithName("custom-name-23")
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DBL.SU")
                .ToSitecoreItem();
            var accommodationImages = new List<Item> { renamedItem };
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            var result = InvokePrepareImageForUpdate(image, string.Empty, true, accommodationImages, imagesFolder);

            // Assert
            result.shouldUpdate.Should().BeTrue();
            result.imageItem.Should().Be(renamedItem);
            result.isNewImage.Should().BeFalse();
            dataSourceRepository
                .DidNotReceive()
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>());
        }

        [Fact]
        public void PrepareImageForUpdate_ShouldNotAdoptByCodeField_WhenOrderSuffixDoesNotMatch()
        {
            // Arrange
            // Sibling has the same Code field value but a different order; treat it as a separate image so
            // the Code-field fallback never collapses two distinct images into one.
            var image = new Image { ImageTypeСode = "HAB", RoomCode = "DBL.SU", Order = "23" };
            var siblingItem = new FakeItem()
                .WithName("DBLSU-1")
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DBL.SU")
                .ToSitecoreItem();
            var accommodationImages = new List<Item> { siblingItem };
            var imagesFolder = new FakeItem().ToSitecoreItem();

            // Act
            var result = InvokePrepareImageForUpdate(image, string.Empty, false, accommodationImages, imagesFolder);

            // Assert
            // No URLs and no adoptable existing item => skip update.
            result.shouldUpdate.Should().BeFalse();
            result.imageItem.Should().BeNull();
            result.isNewImage.Should().BeFalse();
        }

        [Fact]
        public void ShowOnSite_ShouldBeTrue_If_HasNoValue_InIndLogic_And_IndYesOrNo()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = null,
                IndYesOrNo = null
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeTrue();
        }

        private string InvokeDownloadFromHbAndUploadToS3(string sizeLabel, string sourceUrl, string hotelCode, string imageName)
        {
            var parameterTypes = new[]
            {
                typeof(string),
                typeof(string),
                typeof(string),
                typeof(string),
                typeof(string),
                typeof(string).MakeByRefType()
            };

            var method = typeof(SyncDataService).GetMethod(
                "DownloadFromHbAndUploadToS3",
                BindingFlags.NonPublic | BindingFlags.Instance,
                binder: null,
                types: parameterTypes,
                modifiers: null);
            method.Should().NotBeNull();

            var args = new object[] { sizeLabel, sourceUrl, hotelCode, imageName, "hbg", null };
            return (string)method.Invoke(sut, args);
        }

        private Dictionary<string, string> InvokeSyncImageToAmazonS3(Image image, string hotelCode)
        {
            var method = typeof(SyncDataService).GetMethod("SyncImageToAmazonS3", BindingFlags.NonPublic | BindingFlags.Instance);
            method.Should().NotBeNull();

            try
            {
                return (Dictionary<string, string>)method.Invoke(sut, new object[] { image, hotelCode });
            }
            catch (TargetInvocationException ex) when (ex.InnerException != null)
            {
                throw ex.InnerException;
            }
        }

        private (string smallUrl, string mediumUrl, string largeUrl) InvokeGetImageUrls(string hotelCode, Image image, string name)
        {
            var method = typeof(SyncDataService).GetMethod("GetImageUrls", BindingFlags.NonPublic | BindingFlags.Instance);
            method.Should().NotBeNull();

            try
            {
                return ((string, string, string))method.Invoke(sut, new object[] { hotelCode, image, name });
            }
            catch (TargetInvocationException ex) when (ex.InnerException != null)
            {
                throw ex.InnerException;
            }
        }

        private bool InvokeHasAnyImageUrl(string smallUrl, string mediumUrl, string largeUrl)
        {
            var method = typeof(SyncDataService).GetMethod("HasAnyImageUrl", BindingFlags.NonPublic | BindingFlags.Static);
            method.Should().NotBeNull();
            return (bool)method.Invoke(null, new object[] { smallUrl, mediumUrl, largeUrl });
        }

        private Dictionary<string, string> InvokeBuildImageChanges(Image image, string smallUrl, string mediumUrl, string largeUrl)
        {
            var method = typeof(SyncDataService).GetMethod("BuildImageChanges", BindingFlags.NonPublic | BindingFlags.Static);
            method.Should().NotBeNull();
            return (Dictionary<string, string>)method.Invoke(null, new object[] { image, smallUrl, mediumUrl, largeUrl });
        }

        private string InvokeGetImageName(Image image)
        {
            var method = typeof(SyncDataService).GetMethod("GetImageName", BindingFlags.NonPublic | BindingFlags.Static);
            method.Should().NotBeNull();
            return (string)method.Invoke(null, new object[] { image });
        }

        private (bool shouldUpdate, Item imageItem, bool isNewImage, string smallUrl, string mediumUrl, string largeUrl) InvokePrepareImageForUpdate(
            Image image,
            string hotelCode,
            bool addNew,
            List<Item> accommodationImages,
            Item imagesFolder)
        {
            var method = typeof(SyncDataService).GetMethod("PrepareImageForUpdate", BindingFlags.NonPublic | BindingFlags.Instance);
            method.Should().NotBeNull();

            return ((bool, Item, bool, string, string, string))method.Invoke(
                sut,
                new object[] { image, hotelCode, addNew, accommodationImages, imagesFolder });
        }

        private sealed class StubHttpMessageHandler : HttpMessageHandler
        {
            public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
            {
                ResponseFactory = responseFactory;
            }

            public Func<HttpRequestMessage, HttpResponseMessage> ResponseFactory { get; }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
                => Task.FromResult(ResponseFactory(request));
        }

        [Fact]
        public void ShowOnSite_ShouldBeFalse_If_InIndLogic_HasFalseValue_And_IndYesOrNo_HasNoValue()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = false,
                IndYesOrNo = null
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void ShowOnSite_ShouldBeTrue_If_InIndLogic_HasTrueValue_And_IndYesOrNo_HasNoValue()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = true,
                IndYesOrNo = null
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ShowOnSite_ShouldBeFalse_If_InIndLogic_HasNoValue_And_IndYesOrNo_HasFalseValue()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = null,
                IndYesOrNo = false
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void ShowOnSite_ShouldBeTrue_If_InIndLogic_HasNoValue_And_IndYesOrNo_HasTrueValue()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = null,
                IndYesOrNo = true
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ShowOnSite_ShouldBeTrue_If_InIndLogic_HasTrueValue_And_IndYesOrNo_HasTrueValue()
        {
            // Assert
            var facility = new AccommodationFacility
            {
                IndLogic = true,
                IndYesOrNo = true
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void ShowOnSite_ShouldBeFalse_If_InIndLogic_HasFalseValue_And_IndYesOrNo_HasFalseValue()
        {
            // Assert
            var facility = new AccommodationFacility()
            {
                IndLogic = false,
                IndYesOrNo = false
            };

            // Act
            var actual = sut.ShouldShowOnSite(facility);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void SyncFacilityTypologies_ShouldSyncData(TemplateItem template, Item parent, DatasourceDbItem expectedItem, FacilityTypology expected)
        {
            // Arrange
            masterDataService
                .GetFacilityTypologies(null)
                .Returns(new List<FacilityTypology> { expected });
            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncFacilityTypologies(template.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Code);
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypes_ShouldSyncData(TemplateItem template, Item parent, RoomTypeDbItem expectedItem, RoomType expected)
        {
            // Arrange
            masterDataService
                .GetRoomTypes(null)
                .Returns(new List<RoomType> { expected });
            searchRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), out bool _, false)
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncRoomTypes(template.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Description);
            actual.Fields[Destinations.Constants.Fields.RoomType.TypeDescriptionContent].Value.Should()
                .Be(expected.TypeDescription.Content);
            actual.Fields[Destinations.Constants.Fields.RoomType.CharacteristicDescriptionContent].Value.Should()
                .Be(expected.CharacteristicDescription.Content);
        }

        [Theory]
        [AutoDbData]
        public void SyncFacilityGroups_NameShouldBeEqualToDescrptionContent(TemplateItem template, Item parent, FacilityGroup expected, DatasourceDbItem expectedItem)
        {
            // Arrange
            masterDataService
                .GetFacilityGroups(Arg.Any<string[]>(), null)
                .Returns(new List<FacilityGroup> { expected });
            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncFacilityGroups(template.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Description.Content);
        }

        [Theory]
        [AutoDbData]
        public void SyncFacilityGroups_NameShouldBeEqualToCode_If_DescriptionContentHasNoValue(TemplateItem template, Item parent, FacilityGroup expected, DatasourceDbItem expectedItem)
        {
            // Arrange
            expected.Description = null;

            masterDataService
                .GetFacilityGroups(Arg.Any<string[]>(), null)
                .Returns(new List<FacilityGroup> { expected });
            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncFacilityGroups(template.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Code);
        }

        [Theory]
        [AutoDbData]
        public void SyncFacilities_NameShouldBeEqualToCode_If_DescriptionContentHasNoValue(string facilityGroupCode, TemplateItem templateItem, Item parent, Facility expected, DatasourceDbItem expectedItem)
        {
            // Arrange
            expected.FacilityGroupCode = facilityGroupCode;
            expected.Description = null;

            masterDataService
                .GetFacilities(null)
                .Returns(new List<Facility> { expected });
            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncFacilities(facilityGroupCode, templateItem.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Code);
        }

        [Theory]
        [AutoDbData]
        public void SyncFacilities_NameShouldBeEqualToDescrptionContent(TemplateItem template, Item parent, string facilityGroupCode, Facility expected, DatasourceDbItem expectedItem)
        {
            // Arrange
            expected.FacilityGroupCode = facilityGroupCode;

            masterDataService
                .GetFacilities(null)
                .Returns(new List<Facility> { expected });
            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = sut.SyncFacilities(facilityGroupCode, template.ID, parent).FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Description.Content);
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationItemSuccssed(
            string hotelbedscode,
            AccommodationDbItemWithAirport expectedItem,
            Accommodation expectedAccommodation)
        {
            // Arrange
            expectedAccommodation.Images = null;
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;
            expectedAccommodation.Code = hotelbedscode;
            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, Context.Database.GetItem(expectedItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault();
            var actualFirstVersion = actual.Versions[Version.First];

            // Assert
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Description].Value.Should()
                .Be(expectedAccommodation.Description.Content);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Latitude].Value.Should()
                .Be(expectedAccommodation.Coordinates.Latitude);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Longitude].Value.Should()
                .Be(expectedAccommodation.Coordinates.Longitude);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Address].Value.Should()
                .Be(expectedAccommodation.Address.Content);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.City].Value.Should()
                .Be(expectedAccommodation.City.Content);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.PostalCode].Value.Should()
                .Be(expectedAccommodation.PostalCode);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Website].Value.Should()
                .Be(expectedAccommodation.Website);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Email].Value.Should()
                .Be(expectedAccommodation.Email);
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.BookingPhone].Value.Should()
                .Be(expectedAccommodation.GetBookingPhone());
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.ManagementPhone].Value.Should()
                .Be(expectedAccommodation.GetManagementPhone());
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.HotelPhone].Value.Should()
                .Be(expectedAccommodation.GetHotelPhone());
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldNotCreateImageItem_WhenAllImageUploadsFail(
            DbWithImageSetting db,
            string hotelbedscode,
            AccommodationDbItemWithAirport accommodationDbItem,
            Accommodation expectedAccommodation,
            Image expectedImage)
        {
            // Arrange
            expectedImage.RoomCode = null;
            expectedAccommodation.Images = new List<Image> { expectedImage };
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;

            expectedAccommodation.Code = hotelbedscode;

            accommodationDbItem.Name = "Fake";
            var imagesFolderDbItem = new DbItem(Destinations.Constants.Fields.AccommodationItem.Images, ID.NewID, Destinations.Constants.TemplateIds.ImagesFolder);
            accommodationDbItem.Children.Add(imagesFolderDbItem);
            db.Add(accommodationDbItem);

            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, db.GetItem(accommodationDbItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(expectedAccommodation);
            dataSourceRepository
                .GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Images, Destinations.Constants.TemplateIds.ImagesFolder, Arg.Any<Item>())
                .Returns(db.GetItem(imagesFolderDbItem.ID));

            // Act
            _ = sut.UpdateAccommodations(items, null, null, true).FirstOrDefault();

            // Assert
            var imagesFolder = db.GetItem(imagesFolderDbItem.ID);
            imagesFolder.Children.Should().BeEmpty();
            dataSourceRepository.DidNotReceive().GetOrCreateItem(
                $"{expectedImage.TypeCode}-{expectedImage.Order}",
                Destinations.Constants.TemplateIds.ExternalImage,
                Arg.Any<Item>());
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldNotUpdateImages_IfImageHaveSpecificType(
            DbWithImageSetting db,
            string hotelbedscode,
            AccommodationDbItemWithAirport accommodationDbItem,
            Accommodation expectedAccommodation,
            Image expectedImage)
        {
            // Arrange
            var typeToExclude = "CON";
            expectedImage.RoomCode = null;
            expectedImage.ImageTypeСode = typeToExclude;
            expectedAccommodation.Images = new List<Image> { expectedImage };
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;

            expectedAccommodation.Code = hotelbedscode;
            db.Add(accommodationDbItem);

            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, db.GetItem(accommodationDbItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });

            // Act
            using (new SettingsSwitcher("HotelBeds.ExcludeFromSyncImageTypeCodes", typeToExclude))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                // Act
                var actual = syncDataService.UpdateAccommodations(items, null, null, true).FirstOrDefault().Children;

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldSuccssfullUpdateAccommodationBoards(
            Db db,
            string hotelbedscode,
            AccommodationDbItemWithAirport accommodationDbItem,
            Accommodation accommodation,
            BoardDbItem boardDbItem)
        {
            accommodation.Images = null;
            accommodation.Facilities = null;
            accommodation.Rooms = null;
            accommodation.Boards = null;
            accommodation.Code = hotelbedscode;

            accommodationDbItem.Name = "Fake";
            boardDbItem.Name = "FakeBoard";
            accommodationDbItem.Children.Add(boardDbItem);

            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, db.GetItem(accommodationDbItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { accommodation });
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);
            searchRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(new Dictionary<string, Item>()
                {
                    { accommodation.BoardCodes.FirstOrDefault(), db.GetItem(boardDbItem.ID) }
                });

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(db.GetItem(boardDbItem.ID));

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault().Children.FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.AccommodationBoardItem.BoardType].Value.Should().Be(boardDbItem.ID.ToString());
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldSuccessfulUpdateAccommodationRooms(
            Db db,
            string hotelBedsCode,
            AccommodationDbItemWithAirport accommodationDbItem,
            Accommodation accommodation,
            RoomDbItem roomDbItem,
            Wildcard[] wildcards,
            Room expectedRoom)
        {
            expectedRoom.RoomCode = wildcards.First().RoomType;
            expectedRoom.RoomFacilities = null;
            expectedRoom.RoomStays = null;
            accommodation.Images = null;
            accommodation.Facilities = null;
            accommodation.BoardCodes = null;
            accommodation.Rooms = new List<Room>() { expectedRoom };
            accommodation.Code = hotelBedsCode;
            accommodation.Wildcards = wildcards;

            accommodationDbItem.Name = "Fake";
            roomDbItem.Name = "FakeRoom";
            accommodationDbItem.Children.Add(roomDbItem);

            var items = new Dictionary<string, Item>()
            {
                { hotelBedsCode, db.GetItem(accommodationDbItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { accommodation });

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>())
                .Returns(new Dictionary<string, Item>()
                {
                    { accommodation.Rooms.FirstOrDefault().RoomCode, db.GetItem(roomDbItem.ID) }
                });

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(db.GetItem(roomDbItem.ID));
            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns(wildcards.First().HotelRoomDescription.Content);

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault().Children.FirstOrDefault();

            // Assert
            actual.Fields[Destinations.Constants.Fields.DatasourceItem.Name].Value.Should().Be(wildcards.First().HotelRoomDescription.Content);
            actual.Fields[Destinations.Constants.Fields.AccommodationRoomItem.RoomType].Value.Should().Be(roomDbItem.ID.ToString());
            actual.Fields[Destinations.Constants.Fields.AccommodationRoomItem.Description].Value.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationRoomStays(
            Db db,
            string hotelBedsCode,
            AccommodationDbItemWithAirport accommodationDbItem,
            Accommodation accommodation,
            RoomDbItem roomDbItem,
            Room room,
            RoomStayDbItem roomStayDbItem,
            RoomStay expectedRoomStay)
        {
            expectedRoomStay.RoomFacilities = null;
            room.RoomFacilities = null;
            room.RoomStays = new List<RoomStay>() { expectedRoomStay };
            accommodation.Images = null;
            accommodation.Facilities = null;
            accommodation.BoardCodes = null;
            accommodation.Rooms = new List<Room>() { room };
            accommodation.Code = hotelBedsCode;

            accommodationDbItem.Name = "Fake";
            roomDbItem.Name = "FakeRoom";
            roomStayDbItem.Name = "FakeRoomStay";
            roomDbItem.Children.Add(roomStayDbItem);
            accommodationDbItem.Children.Add(roomDbItem);

            var items = new Dictionary<string, Item>()
            {
                { hotelBedsCode, db.GetItem(accommodationDbItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { accommodation });
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>())
                .Returns(new Dictionary<string, Item>()
                {
                    { accommodation.Rooms.FirstOrDefault().RoomCode, db.GetItem(roomDbItem.ID) }
                });

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(x => x != Destinations.Constants.TemplateIds.RoomStays), Arg.Any<Item>())
                .Returns(db.GetItem(roomDbItem.ID));

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(x => x == Destinations.Constants.TemplateIds.RoomStays), Arg.Any<Item>())
                .Returns(db.GetItem(roomStayDbItem.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms - HBG");

            // Act
            var actual = sut.UpdateAccommodations(items)
                .FirstOrDefault()
                .Axes.GetDescendant(roomStayDbItem.Name);

            // Assert
            actual.Fields[Destinations.Constants.Fields.RoomStayItem.StayType].Value.Should().Be(expectedRoomStay.StayType);
            actual.Fields[Destinations.Constants.Fields.AccommodationRoomItem.Description].Value.Should().Be(expectedRoomStay.Description);
            actual.Fields[Destinations.Constants.Fields.RoomStayItem.Order].Value.Should().Be(expectedRoomStay.Order);
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_AccommodationAirportsField_ShouldNotChanged_IfServiceHasNoAirports(
            Db db,
            string hotelbedscode,
            AccommodationDbItemWithAirport expectedItem,
            Accommodation expectedAccommodation)
        {
            // Arrange
            expectedAccommodation.Images = null;
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;
            expectedAccommodation.Code = hotelbedscode;
            expectedAccommodation.Airports = null;

            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, db.GetItem(expectedItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault();
            var actualFirstVersion = actual.Versions[Version.First];

            // Assert
            cacheRepository.DidNotReceive().GetItem<Dictionary<string, ID>>(Arg.Any<string>());
            searchRepository.DidNotReceive().GetItemIdsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>());
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Airports].Value.Should()
                .Be(HotelBedsTestsData.DefaultAiport);
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_AccommodationAirportsField_ShouldNotChanged_IfSearchRepositoryHasNoAirports(
            string hotelbedscode,
            AccommodationDbItemWithAirport expectedItem,
            Accommodation expectedAccommodation)
        {
            // Arrange
            expectedAccommodation.Images = null;
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;
            expectedAccommodation.Code = hotelbedscode;
            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, Context.Database.GetItem(expectedItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });

            searchRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(new Dictionary<string, Item>());

            Dictionary<string, ID> nullDictionary = null;
            cacheRepository.GetItem<Dictionary<string, ID>>(Arg.Any<string>()).Returns(nullDictionary);

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault();
            var actualFirstVersion = actual.Versions[Version.First];

            // Assert
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Airports].Value.Should()
                .Be(HotelBedsTestsData.DefaultAiport);
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateNotAccommodationAirportsField_IfFieldNotEmpty(
            Db db,
            string hotelbedscode,
            AccommodationDbItemWithAirport expectedItem,
            Accommodation expectedAccommodation,
            DatasourceDbItem airport)
        {
            // Arrange
            expectedAccommodation.Images = null;
            expectedAccommodation.Facilities = null;
            expectedAccommodation.BoardCodes = null;
            expectedAccommodation.Rooms = null;
            expectedAccommodation.Code = hotelbedscode;
            var items = new Dictionary<string, Item>()
            {
                { hotelbedscode, db.GetItem(expectedItem.ID) }
            };

            masterDataService
                .GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation> { expectedAccommodation });

            var expectedAirport = expectedAccommodation.Airports.FirstOrDefault();

            searchRepository
                .GetItemIdsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(new Dictionary<string, ID>() { { expectedAirport.TerminalCode, airport.ID } });

            Dictionary<string, ID> nullDictionary = null;
            cacheRepository.GetItem<Dictionary<string, ID>>(Arg.Any<string>()).Returns(nullDictionary);
            var expectedValue = $"{airport.ID}|{HotelBedsTestsData.DefaultAiport}";

            // Act
            var actual = sut.UpdateAccommodations(items).FirstOrDefault();
            var actualFirstVersion = actual.Versions[Version.First];

            // Assert
            actualFirstVersion.Fields[Destinations.Constants.Fields.AccommodationItem.Airports].Value.Should().NotBe(expectedValue);
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationFacilities_IfFacilitiesWereSupplied(Db db, Accommodation accommodation)
        {
            // Arrange
            accommodation.BoardCodes = null;
            accommodation.Rooms = null;

            var itemToUpdate = new AccommodationDbItem("ItemToUpdate");

            var facilityFolderItem =
                new AccommodationFacilitiesFolderDbItem(Destinations.Constants.Fields.AccommodationItem.Facilities);

            var dataFolderItem = new DataFolderDbItem("Data");

            var facilityTypesFolderItem = new FacilityTypesFolderDbItem("FacilityTypesFolder");
            var dict = new Dictionary<string, DbItem>();
            foreach (var facility in accommodation.Facilities)
            {
                var facilityItem = new FacilityDbItem(facility.Code);
                facilityFolderItem.Children.Add(facilityItem);
                var facilityTypesGroupItem = new FacilityTypesGroupDbItem("FacilityTypesGroup");
                SetDbItemValueByFieldName(facilityTypesGroupItem, Destinations.Constants.Fields.DatasourceItem.Code, facility.FacilityGroupCode);
                var facilityTypeItem = new FacilityTypeDbItem(facilityItem.Name);
                SetDbItemValueByFieldName(facilityTypeItem, Destinations.Constants.Fields.DatasourceItem.Code, facility.FacilityCode);
                facilityTypesGroupItem.Children.Add(facilityTypeItem);
                facilityTypesFolderItem.Children.Add(facilityTypesGroupItem);
                dict.Add("/sitecore/content/*[@@templateid ='" + Templates.Data.Id + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesFolder + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesGroup + "' AND @Code = '" + facility.FacilityGroupCode + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityType + "' AND @Code = '" + facility.FacilityCode + "']", facilityTypeItem);
            }

            dataFolderItem.Children.Add(facilityTypesFolderItem);

            itemToUpdate.Children.Add(facilityFolderItem);

            db.Add(itemToUpdate);
            db.Add(dataFolderItem);
            foreach (var entry in dict)
            {
                simpleCache.GetCachedValue(entry.Key, Arg.Any<Func<Item>>()).Returns(db.GetItem(entry.Value.ID));
            }

            var itemsToUpdate = new Dictionary<string, Item>()
            {
                { accommodation.Code, db.GetItem(itemToUpdate.ID) }
            };

            masterDataService.GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation>() { accommodation });
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .ReturnsForAnyArgs(db.GetItem(facilityFolderItem.ID));

            var fakeContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "rootPath", "/sitecore/content" }
                });

            fakeContext.Database = db.Database;

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;

                sut.UpdateAccommodations(itemsToUpdate).FirstOrDefault();

                var modelFacilities = accommodation.Facilities;
                var actual = db.GetItem(facilityFolderItem.ID).Children.ToArray();

                // Assert
                foreach (Item facility in actual)
                {
                    var modelFacility = modelFacilities.First(x =>
                        x.Number == facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value);

                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value.Should().Be(modelFacility.Number);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Order].Value.Should().Be(modelFacility.Order);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo].Value.Should()
                        .Be(modelFacility.IndYesOrNo.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndFee].Value.Should()
                        .Be(modelFacility.IndFee.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndLogic].Value.Should()
                        .Be(modelFacility.IndLogic.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Voucher].Value.Should()
                        .Be(modelFacility.Voucher.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.Distance].Value.Should()
                        .Be(modelFacility.Distance);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeFrom].Value.Should()
                        .Be(modelFacility.AgeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeTo].Value.Should()
                        .Be(modelFacility.AgeTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TextValue].Value.Should()
                        .Be(modelFacility.TextValue);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateFrom].Value.Should()
                        .Be(modelFacility.DateFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateTo].Value.Should()
                        .Be(modelFacility.DateTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeFrom].Value.Should()
                        .Be(modelFacility.TimeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeTo].Value.Should()
                        .Be(modelFacility.TimeTo);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Currency].Value.Should()
                        .Be(modelFacility.Currency);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.ApplicationType].Value.Should()
                        .Be(modelFacility.ApplicationType);
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationRooms_IfRoomsWhereSupplied(Db db, Accommodation accommodation)
        {
            // Arrange
            accommodation.Facilities = null;
            accommodation.BoardCodes = null;

            var itemToUpdate = new AccommodationDbItem("ItemToUpdate");

            var roomsFolderItem = new AccommodationRoomsFolderDbItem("RoomsFolder");

            var roomTypesFolderItem = new DbItem("RoomTypesFolder")
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomTypesFolder
            };

            var hotelBedsRoomTypesGroupItem = new DbItem("HotelBedsRoomTypesGroup")
            {
                TemplateID = Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup
            };

            var roomTypeIds = new List<string>();
            var dict = new Dictionary<string, DbItem>();
            foreach (var room in accommodation.Rooms)
            {
                var name = $"{room.Description} - {room.RoomCode}";

                var roomItem = new RoomDbItem(name);

                roomsFolderItem.Children.Add(roomItem);

                var roomTypeItem = new RoomTypeDbItem(name);

                db.Add(roomTypeItem);
                roomTypeIds.Add(db.GetItem(roomTypeItem.ID).ID.ToString());

                dataSourceRepository
                    .GetOrCreateItem(Arg.Is<string>(i => i.Equals(roomItem.Name)), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.AccommodationRoom)), Arg.Any<Item>()).Returns(db.GetItem(roomItem.ID));

                searchRepository
                    .GetOrCreateItem(Arg.Is<string>(i => i.Equals(roomTypeItem.Name)), Arg.Is<string>(i => i.Equals(room.RoomCode)), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.RoomType)), Arg.Any<Item>(), out bool _, false)
                    .Returns(db.GetItem(roomTypeItem.ID));
                dict[$"/sitecore/content/*[@@templateid ='" + Templates.Data.Id + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.RoomTypesFolder + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup + "']"] = roomTypeItem;
            }

            roomTypesFolderItem.Children.Add(hotelBedsRoomTypesGroupItem);
            itemToUpdate.Children.Add(roomsFolderItem);

            db.Add(itemToUpdate);

            var dataFolderItem = new DataFolderDbItem("Data");

            dataFolderItem.Children.Add(roomTypesFolderItem);

            db.Add(dataFolderItem);
            foreach (var entry in dict)
            {
                simpleCache.GetCachedValue(entry.Key, Arg.Any<Func<Item>>()).Returns(db.GetItem(entry.Value.ID));
            }

            var itemsToUpdate = new Dictionary<string, Item>()
            {
                { accommodation.Code, db.GetItem(itemToUpdate.ID) }
            };

            masterDataService.GetRoomTypes(null).Returns(accommodation.Rooms
                .Select(x => new RoomType() { Code = x.RoomCode, Description = x.Description }).ToList());
            masterDataService.GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation>() { accommodation });

            masterDataService.GetAccommodation(Arg.Any<string>(), null).Returns(accommodation);

            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>())
                .Returns(new Dictionary<string, Item>());

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(i => i == Destinations.Constants.TemplateIds.AccommodationRoomsFolder), Arg.Any<Item>(), Arg.Any<bool>())
                .Returns(db.GetItem(roomsFolderItem.ID));

            databaseProvider.SelectSingleItem(Arg.Any<string>(), DatabaseType.Content).Returns(db.GetItem(roomTypesFolderItem.ID));

            var roomStayItem = new RoomStayDbItem("RoomStay");

            db.Add(roomStayItem);

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.RoomStays)), Arg.Any<Item>())
                .Returns(db.GetItem(roomStayItem.ID));

            var fakeContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "rootPath", "/sitecore/content" }
                })
            {
                Database = db.Database
            };
            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms - HBG");

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;

                sut.UpdateAccommodations(itemsToUpdate).FirstOrDefault();

                var rooms = db.GetItem(roomsFolderItem.ID).Children.ToArray();

                foreach (var room in rooms)
                {
                    var actual = room.Fields[Destinations.Constants.Fields.AccommodationRoomItem.RoomType].Value;

                    // Assert
                    actual.Should().BeOneOf(roomTypeIds);
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationRoomFacilities_IfRoomsWhereSupplied(Db db, Accommodation accommodation)
        {
            var firstRoom = accommodation.Rooms.First();
            var f = firstRoom.RoomFacilities.ToList();
            f.Add(f.First());
            firstRoom.RoomFacilities = f;
            // Arrange
            accommodation.Facilities = null;
            accommodation.BoardCodes = null;

            var itemToUpdate = new AccommodationDbItem("ItemToUpdate");

            var roomsFolderItem = new AccommodationRoomsFolderDbItem("RoomsFolder");

            var roomTypesFolderItem = new DbItem("RoomTypesFolder")
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomTypesFolder
            };

            var hotelBedsRoomTypesGroupItem = new DbItem("HotelBedsRoomTypesGroup")
            {
                TemplateID = Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup
            };

            var roomTypeIds = new List<string>();
            var dict = new Dictionary<string, DbItem>();
            var folder = new DbItem("Folder");
            foreach (var room in accommodation.Rooms)
            {
                var name = $"{room.Description} - {room.RoomCode}";

                var roomItem = new RoomDbItem(name);

                roomsFolderItem.Children.Add(roomItem);

                var roomTypeItem = new RoomTypeDbItem(name);

                db.Add(roomTypeItem);
                roomTypeIds.Add(db.GetItem(roomTypeItem.ID).ID.ToString());

                dataSourceRepository
                    .GetOrCreateItem(Arg.Is<string>(i => i.Equals(roomItem.Name)), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.AccommodationRoom)), Arg.Any<Item>())
                    .Returns(db.GetItem(roomItem.ID));

                searchRepository
                    .GetOrCreateItem(Arg.Is<string>(i => i.Equals(roomTypeItem.Name)), Arg.Is<string>(i => i.Equals(room.RoomCode)), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.RoomType)), Arg.Any<Item>(), out bool _, false)
                    .Returns(db.GetItem(roomTypeItem.ID));

                dict[$"/sitecore/content/*[@@templateid ='" + Templates.Data.Id + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.RoomTypesFolder + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.HotelBedsRoomTypesGroup + "']"] = roomTypeItem;
                int j = 0;
                foreach (var facility in room.RoomFacilities)
                {
                    var dbItem = new DbItem(facility.Number)
                    {
                        Fields =
                        {
                            new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                            {
                                Value = facility.Code
                            },
                            new DbField(Destinations.Constants.Fields.DatasourceItem.Name)
                            {
                                Value = facility.Number
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType),
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.Number)
                            {
                                Value = facility.Number
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.Order)
                            {
                                Value = facility.Order
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo)
                            {
                                Value = facility.IndYesOrNo.GetBoolAsIntegerString()
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndLogic)
                            {
                                Value = facility.IndLogic.GetBoolAsIntegerString()
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.Voucher)
                            {
                                Value = facility.Voucher.GetBoolAsIntegerString()
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.Amount)
                            {
                                Value = facility.Amount
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.Currency)
                            {
                                Value = facility.Currency
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.ApplicationType)
                            {
                                Value = facility.ApplicationType
                            },
                            new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndFee)
                            {
                                Value = facility.IndFee.GetBoolAsIntegerString()
                            },
                            new DbField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite)
                        }
                    };

                    dict["/sitecore/content/*[@@templateid ='" + Templates.Data.Id + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesFolder + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesGroup + "' AND @Code = '" + facility.FacilityGroupCode + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityType + "' AND @Code = '" + facility.FacilityCode + "']"] = dbItem;
                    db.Add(dbItem);
                }
            }

            dataSourceRepository.When(i => i.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())).Do((i) => { folder.Add(new DbItem((string)i.Args().First())); });
            dataSourceRepository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(args =>
            {
                var item = new DbItem((string)args[0])
                {
                    Fields =
                    {
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Code),
                        new DbField(Destinations.Constants.Fields.DatasourceItem.Name), new DbField(Destinations.Constants.Fields.BaseFacilityItem.FacilityType), new DbField(Destinations.Constants.Fields.BaseFacilityItem.Number), new DbField(Destinations.Constants.Fields.BaseFacilityItem.Order), new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo), new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndLogic), new DbField(Destinations.Constants.Fields.BaseFacilityItem.Voucher), new DbField(Destinations.Constants.Fields.BaseFacilityItem.Amount), new DbField(Destinations.Constants.Fields.BaseFacilityItem.Currency), new DbField(Destinations.Constants.Fields.BaseFacilityItem.ApplicationType), new DbField(Destinations.Constants.Fields.BaseFacilityItem.IndFee), new DbField(Destinations.Constants.Fields.BaseAppearance.ShowOnSite)
                    }
                };

                db.Add(item);
                return db.GetItem(item.ID);
            });

            roomTypesFolderItem.Children.Add(hotelBedsRoomTypesGroupItem);
            itemToUpdate.Children.Add(roomsFolderItem);

            db.Add(folder);
            db.Add(itemToUpdate);

            dataSourceRepository
                .GetOrCreateItem(Arg.Is<string>(i => i.Equals(Destinations.Constants.Fields.AccommodationItem.Facilities)), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.RoomFacilitiesFolder)), Arg.Any<Item>())
                .Returns(db.GetItem(folder.ID));

            var dataFolderItem = new DataFolderDbItem("Data");

            dataFolderItem.Children.Add(roomTypesFolderItem);

            db.Add(dataFolderItem);
            foreach (var entry in dict)
            {
                simpleCache.GetCachedValue(entry.Key, Arg.Any<Func<Item>>()).Returns(db.GetItem(entry.Value.ID));
            }

            var itemsToUpdate = new Dictionary<string, Item>()
            {
                { accommodation.Code, db.GetItem(itemToUpdate.ID) }
            };
            var roomTypes = accommodation.Rooms
                .Select(x => new RoomType() { Code = x.RoomCode, Description = x.Description }).ToList();

            masterDataService.GetRoomTypes(null).Returns(roomTypes);

            masterDataService.GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation>() { accommodation });
            masterDataService.GetAccommodation(Arg.Any<string>(), null).Returns(accommodation);

            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>())
                .Returns(new Dictionary<string, Item>());

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(i => i == Destinations.Constants.TemplateIds.AccommodationRoomsFolder), Arg.Any<Item>(), Arg.Any<bool>()).Returns(db.GetItem(roomsFolderItem.ID));
            databaseProvider.SelectSingleItem(Arg.Any<string>(), DatabaseType.Content).Returns(db.GetItem(roomTypesFolderItem.ID));
            var roomStayItem = new RoomStayDbItem("RoomStay");

            db.Add(roomStayItem);

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(i => i.Equals(Destinations.Constants.TemplateIds.RoomStays)), Arg.Any<Item>()).Returns(db.GetItem(roomStayItem.ID));

            var fakeContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "rootPath", "/sitecore/content" }
                })
            {
                Database = db.Database
            };
            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms - HBG");

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;

                sut.UpdateAccommodations(itemsToUpdate).FirstOrDefault();

                var rooms = db.GetItem(roomsFolderItem.ID).Children.ToArray();

                foreach (var room in rooms)
                {
                    var actual = room.Fields[Destinations.Constants.Fields.AccommodationRoomItem.RoomType].Value;

                    // Assert
                    actual.Should().BeOneOf(roomTypeIds);
                }
            }
        }

        [Theory]
        [AutoDbData]
        public void UpdateAccommodations_ShouldUpdateAccommodationFacilities_IfFacilityTypeNotExist(Db db, Accommodation accommodation)
        {
            // Arrange
            accommodation.BoardCodes = null;
            accommodation.Rooms = null;

            var itemToUpdate = new AccommodationDbItem("ItemToUpdate");

            var facilityTypeTemplate = new FacilityTypeTemplate("FacilityType");
            db.Add(facilityTypeTemplate);

            var facilityFolderItem =
                new AccommodationFacilitiesFolderDbItem(Destinations.Constants.Fields.AccommodationItem.Facilities);

            foreach (var facility in accommodation.Facilities)
            {
                var facilityItem = new FacilityDbItem(facility.Code);

                facilityItem.Name = ItemUtil.ProposeValidItemName(facility.Description?.Content);

                db.Add(facilityItem);

                dataSourceRepository
                    .GetOrCreateItem(Arg.Is<string>(i => i == facilityItem.Name), Arg.Is<ID>(i => i == Destinations.Constants.TemplateIds.AccommodationFacility), Arg.Any<Item>(), Arg.Any<bool>()).Returns(db.GetItem(facilityItem.ID));
            }

            var dataFolderItem = new DataFolderDbItem("Data");

            var facilityTypesFolderItem = new FacilityTypesFolderDbItem("FacilityTypesFolder");

            var facilityGroupItem = new FacilityTypesGroupDbItem("FacilityGroup");

            dataFolderItem.Children.Add(facilityTypesFolderItem);

            dataFolderItem.Children.Add(facilityGroupItem);

            itemToUpdate.Children.Add(facilityFolderItem);

            db.Add(itemToUpdate);
            db.Add(dataFolderItem);

            var itemsToUpdate = new Dictionary<string, Item>()
            {
                { accommodation.Code, db.GetItem(itemToUpdate.ID) }
            };

            var facilities = new List<Facility>();

            foreach (var facility in accommodation.Facilities)
            {
                masterDataService.GetFacilityGroups(Arg.Is<string[]>(i => i.Contains(facility.FacilityGroupCode)), null)
                    .Returns(new List<FacilityGroup>()
                        { new FacilityGroup() { Description = facility.Description, Code = facility.Code } });

                facilities.Add(new Facility()
                {
                    Code = facility.FacilityCode,
                    FacilityGroupCode = facility.FacilityGroupCode,
                    Description = facility.Description
                });
            }

            masterDataService.GetFacilities(null).Returns(facilities);
            masterDataService.GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation>() { accommodation });

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Is<ID>(i => i == Destinations.Constants.TemplateIds.FacilityTypesGroup), Arg.Any<Item>(), Arg.Any<bool>()).Returns(db.GetItem(facilityGroupItem.ID));

            var fakeContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "rootPath", "/sitecore/content" }
                });

            fakeContext.Database = db.Database;

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;

                sut.UpdateAccommodations(itemsToUpdate).FirstOrDefault();

                var modelFacilities = accommodation.Facilities;
                var actual = db.GetItem(facilityFolderItem.ID).Children.ToArray();

                // Assert
                foreach (var facility in actual)
                {
                    var modelFacility = modelFacilities.First(x =>
                        x.Number == facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value.Should().Be(modelFacility.Number);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Order].Value.Should().Be(modelFacility.Order);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo].Value.Should()
                        .Be(modelFacility.IndYesOrNo.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndFee].Value.Should()
                        .Be(modelFacility.IndFee.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndLogic].Value.Should()
                        .Be(modelFacility.IndLogic.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Voucher].Value.Should()
                        .Be(modelFacility.Voucher.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.Distance].Value.Should()
                        .Be(modelFacility.Distance);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeFrom].Value.Should()
                        .Be(modelFacility.AgeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeTo].Value.Should()
                        .Be(modelFacility.AgeTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TextValue].Value.Should()
                        .Be(modelFacility.TextValue);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateFrom].Value.Should()
                        .Be(modelFacility.DateFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateTo].Value.Should()
                        .Be(modelFacility.DateTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeFrom].Value.Should()
                        .Be(modelFacility.TimeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeTo].Value.Should()
                        .Be(modelFacility.TimeTo);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Currency].Value.Should()
                        .Be(modelFacility.Currency);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.ApplicationType].Value.Should()
                        .Be(modelFacility.ApplicationType);
                }
            }
        }

        [Fact]
        public void ResyncFacillities_ShouldBeEmpty_IfItemsForResyncingIsEmpty()
        {
            // Arrange
            var items = new Dictionary<string, HotelItem>();

            // Act
            var actual = sut.ResyncFacilities(items);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().BeEmpty();
        }

        [Fact]
        public void ResyncFacillities_ShouldBeEmpty_IfHotelBedsReturnNoAccommodations()
        {
            // Arrange
            var items = new Dictionary<string, HotelItem>()
            {
                { "Code", new HotelItem() }
            };
            masterDataService.GetAccommodations(Arg.Any<string[]>()).Returns(new List<Accommodation>());

            // Act
            var actual = sut.ResyncFacilities(items);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void ResyncFacillities_ShouldBeEmpty_IfAccommodationHasNoFacilities(
            Db db,
            AccommodationDbItem accommodationDbItem,
            FacilityDbItem candidateForDelitingFacilityDbItem,
            FacilityDbItem expectedFacilityDbItem,
            string hotelBedCode,
            AccommodationFacility accommodationFacility)
        {
            // Arrange
            var accommodations = new List<Accommodation>()
            {
                new Accommodation()
                {
                    Code = hotelBedCode,
                    Facilities = new List<AccommodationFacility>() { accommodationFacility }
                }
            };

            var hotelItems = new Dictionary<string, HotelItem>()
            {
                {
                    hotelBedCode, new HotelItem()
                    {
                        Item = db.GetItem(accommodationDbItem.ID),
                        Facilities = new List<Item>()
                        {
                            db.GetItem(candidateForDelitingFacilityDbItem.ID)
                        }
                    }
                }
            };

            masterDataService.GetAccommodations(Arg.Any<string[]>()).Returns(accommodations);

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(db.GetItem(expectedFacilityDbItem.ID));

            // Act
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;
                var proccededItems = sut.ResyncFacilities(hotelItems);

                var deletedImage = db.GetItem(candidateForDelitingFacilityDbItem.ID);

                // Assert
                deletedImage.Should().BeNull();
                proccededItems.Count.Should().Be(1);
            }
        }

        [Fact]
        public void ResyncImages_ShouldLogWarn_IfNoHotelsToResync()
        {
            // Arrange
            var items = new Dictionary<string, HotelItem>();

            // Act
            var proccededItems = sut.ResyncImages(items);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            proccededItems.Should().BeEmpty();
        }

        [Fact]
        public void ResyncImages_ShouldLogWarn_IfServiceReturnNoHotels()
        {
            var hotelItems = new Dictionary<string, HotelItem>()
            {
                { "8385", new HotelItem() }
            };

            // Act
            var proccededItems = sut.ResyncImages(hotelItems);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            proccededItems.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void ResyncImages_ShouldDeleteBrokenImagesAndResyncImages_IfHotelHasBrokenImages(
            DbWithImageSetting db,
            AccommodationDbItem accommodationDbItem,
            ImageDbItem brokenImageDbItem,
            ImageDbItem expectedImageDbItem,
            string hotelBedCode,
            string atcomCode,
            Image expectedImage)
        {
            // Arrange
            brokenImageDbItem.Name = "Image 1";
            brokenImageDbItem.TemplateID = Destinations.Constants.TemplateIds.ExternalImage;
            expectedImageDbItem.Name = "Image 2";
            expectedImageDbItem.TemplateID = Destinations.Constants.TemplateIds.ExternalImage;
            expectedImage.RoomCode = null;
            var roomsFolderDbItem = new DbItem("Rooms - HBG", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
            {
                new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                {
                    Name = Destinations.Constants.Fields.DatasourceItem.Code,
                    Value = atcomCode,
                    Shared = true
                }
            };
            roomsFolderDbItem.TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder;
            roomsFolderDbItem.Name = "Rooms - HBG";
            roomsFolderDbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, atcomCode);

            var imagesFolderDbItem = new DbItem("Images", ID.NewID, Destinations.Constants.TemplateIds.ImagesFolder);
            imagesFolderDbItem.Children.Add(brokenImageDbItem);
            imagesFolderDbItem.Children.Add(expectedImageDbItem);
            accommodationDbItem.Children.Add(imagesFolderDbItem);
            accommodationDbItem.Children.Add(roomsFolderDbItem);
            db.Add(accommodationDbItem);

            var accommodations = new List<Accommodation>()
            {
                new Accommodation()
                {
                    Code = hotelBedCode,
                    Images = new List<Image>() { expectedImage }
                }
            };

            var hotelItems = new Dictionary<string, HotelItem>()
            {
                {
                    hotelBedCode, new HotelItem()
                    {
                        Item = db.GetItem(accommodationDbItem.ID),
                        Images = new List<Item>()
                        {
                            db.GetItem(brokenImageDbItem.ID)
                        }
                    }
                }
            };

            masterDataService.GetAccommodations(Arg.Any<string[]>()).Returns(accommodations);
            integrationService.SetIntegrationStrategy(ChanelTypes.HotelBeds).ValidateCode(atcomCode).Returns(true);
            dataSourceRepository
                .GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Images, Destinations.Constants.TemplateIds.ImagesFolder, Arg.Any<Item>())
                .Returns(db.GetItem(imagesFolderDbItem.ID));
            dataSourceRepository
                .GetOrCreateItem($"{expectedImage.TypeCode}-{expectedImage.Order}", Destinations.Constants.TemplateIds.ExternalImage, Arg.Any<Item>())
                .Returns(db.GetItem(expectedImageDbItem.ID));

            // Act
            using (new SecurityDisabler())
            {
                var proccededItems = sut.ResyncImages(hotelItems);

                var actual = db.GetItem(expectedImageDbItem.ID);
                var deletedImage = db.GetItem(brokenImageDbItem.ID);

                // Assert
                deletedImage.Should().BeNull();
                var firstVersion = actual.Versions[Version.First];
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Small].Value.Should().BeEmpty();
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Medium].Value.Should().BeEmpty();
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Large].Value.Should().BeEmpty();
                firstVersion.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().BeEmpty();
                proccededItems.Count.Should().Be(1);
            }
        }

        [Theory]
        [AutoDbData]
        public void ResyncImages_ShouldDeleteBrokenImagesAndResyncImages_IfHotelHasBrokenImages2(
    DbWithImageSetting db,
    AccommodationDbItem accommodationDbItem,
    ImageDbItem brokenImageDbItem,
    ImageDbItem expectedImageDbItem,
    string hotelBedCode,
    string atcomCode,
    Image expectedImage)
        {
            // Arrange
            brokenImageDbItem.Name = "Image 1";
            brokenImageDbItem.TemplateID = Destinations.Constants.TemplateIds.ExternalImage;
            expectedImageDbItem.Name = "Image 2";
            expectedImageDbItem.TemplateID = Destinations.Constants.TemplateIds.ExternalImage;
            expectedImage.RoomCode = null;
            var roomsFolderDbItem = new DbItem("Rooms - HBG\"", ID.NewID, Destinations.Constants.TemplateIds.AccommodationRoomsFolder)
            {
                new DbField(Destinations.Constants.Fields.DatasourceItem.Code)
                {
                    Name = Destinations.Constants.Fields.DatasourceItem.Code,
                    Value = atcomCode,
                    Shared = true
                }
            };
            roomsFolderDbItem.TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder;
            roomsFolderDbItem.Name = "Rooms - DI";
            roomsFolderDbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, atcomCode);

            var imagesFolderDbItem = new DbItem("Images", ID.NewID, Destinations.Constants.TemplateIds.ImagesFolder);
            imagesFolderDbItem.Children.Add(brokenImageDbItem);
            imagesFolderDbItem.Children.Add(expectedImageDbItem);
            accommodationDbItem.Children.Add(imagesFolderDbItem);
            accommodationDbItem.Children.Add(roomsFolderDbItem);
            db.Add(accommodationDbItem);

            var accommodations = new List<Accommodation>()
            {
                new Accommodation()
                {
                    Code = hotelBedCode,
                    Images = new List<Image>() { expectedImage }
                }
            };

            var hotelItems = new Dictionary<string, HotelItem>()
            {
                {
                    hotelBedCode, new HotelItem()
                    {
                        Item = db.GetItem(accommodationDbItem.ID),
                        Images = new List<Item>()
                        {
                            db.GetItem(brokenImageDbItem.ID)
                        }
                    }
                }
            };

            masterDataService.GetAccommodations(Arg.Any<string[]>()).Returns(accommodations);
            integrationService.SetIntegrationStrategy(ChanelTypes.HotelBeds).ValidateCode(atcomCode).Returns(false);
            dataSourceRepository
                .GetOrCreateItem(Destinations.Constants.Fields.AccommodationItem.Images, Destinations.Constants.TemplateIds.ImagesFolder, Arg.Any<Item>())
                .Returns(db.GetItem(imagesFolderDbItem.ID));
            dataSourceRepository
                .GetOrCreateItem($"{expectedImage.TypeCode}-{expectedImage.Order}", Destinations.Constants.TemplateIds.ExternalImage, Arg.Any<Item>())
                .Returns(db.GetItem(expectedImageDbItem.ID));

            // Act
            using (new SecurityDisabler())
            {
                var proccededItems = sut.ResyncImages(hotelItems);

                var actual = db.GetItem(expectedImageDbItem.ID);
                var deletedImage = db.GetItem(brokenImageDbItem.ID);

                // Assert
                deletedImage.Should().BeNull();
                var firstVersion = actual.Versions[Version.First];
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Small].Value.Should().Be(string.Empty);
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Medium].Value.Should().Be(string.Empty);
                firstVersion.Fields[Destinations.Constants.Fields.ExternalImageItem.Large].Value.Should().Be(string.Empty);
                firstVersion.Fields[Destinations.Constants.Fields.DatasourceItem.Code].Value.Should().Be(string.Empty);
                proccededItems.Count.Should().Be(1);
            }
        }

        [Fact]
        public void SyncAccommodationBoards_ReturnsEmptyEnumerable_IfNoAccommodationForCode()
        {
            // Arrange
            var hotelBedsCode = "ABC123";
            var lastUpdateTime = DateTime.Now;

            masterDataService.GetAccommodation(hotelBedsCode, null, lastUpdateTime).ReturnsNull();

            // Act
            var result = sut.SyncAccommodationBoards(hotelBedsCode, null, null, lastUpdateTime);

            // Assert
            Assert.Empty(result);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationBoards_LogsError_IfThrowsException(Db db)
        {
            // Arrange
            var hotelItemId = ID.NewID;
            var hotelItem = new DbItem("Hotel", hotelItemId);
            db.Add(hotelItem);

            var hotelBedsCode = "ABC123";

            var accommodation = new Accommodation() { Boards = new List<Board>() { new Board() { Code = "Test" } } };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            // Act
            var test = sut.SyncAccommodationBoards(hotelBedsCode, db.GetItem(hotelItemId)).ToList();

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationBoards_Should_Succeed(Db db)
        {
            // Arrange
            var hotelItem = new DbItem("Penthouse");
            var boardsFolderItemId = ID.NewID;
            var boardsFolderItem = new DbItem("Boards", boardsFolderItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationBoardsFolder
            };

            var boardName = "OnlyBreakfast";
            var boardsItem = new DbItem(boardName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationBoard,
                Fields = { { Destinations.Constants.Fields.AccommodationBoardItem.BoardType, null } }
            };
            boardsFolderItem.Add(boardsItem);
            hotelItem.Add(boardsFolderItem);
            db.Add(hotelItem);

            var boardTypeItemId = ID.NewID;
            var boardTypeItem = new DbItem(boardName, boardTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.BoardType,
                Fields = { Destinations.Constants.Fields.AccommodationBoardItem.BoardType, boardTypeItemId.ToString() }
            };

            var hotelBedsCode = "ABC123";
            var boardCode = "007";

            var dataFolderItem = new DbItem("data")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationBoardsFolder
            };

            dataFolderItem.Add(boardTypeItem);
            db.Add(dataFolderItem);
            var accommodation = new Accommodation()
            {
                Boards = new List<Board>()
                {
                    new Board()
                    {
                        Code = boardCode
                    }
                }
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .Returns(db.GetItem(boardsFolderItemId));

            var bordsItemInstance = db.GetItem(boardTypeItemId);
            searchRepository.GetItemsByCodes(Arg.Any<List<string>>(), Destinations.Constants.TemplateIds.BoardType).Returns(
                new Dictionary<string, Item>()
                {
                    { boardCode, bordsItemInstance }
                });

            // Act
            var test = sut.SyncAccommodationBoards(hotelBedsCode, db.GetItem(hotelItem.ID)).ToList();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.Contains(db.GetItem(boardsItem.ID), test);
        }

        [Fact]
        public void SyncAccommodationFacilities_ReturnsEmptyEnumerable_IfNoAccommodationForCode()
        {
            // Arrange
            var hotelBedsCode = "ABC123";

            masterDataService.GetAccommodation(hotelBedsCode).ReturnsNull();

            // Act
            var result = sut.SyncAccommodationFacilities(hotelBedsCode, null);

            // Assert
            Assert.Empty(result);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationFacilities_ShouldLogError_IfThrowsException(Db db)
        {
            // Arrange
            var hotelItem = new DbItem("Hotel");
            db.Add(hotelItem);

            var hotelBedsCode = "ABC123";

            var accommodation = new Accommodation()
            { Facilities = new List<AccommodationFacility>() { new AccommodationFacility() { Code = "Test" } } };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            // Act
            var test = sut.SyncAccommodationFacilities(hotelBedsCode, db.GetItem(hotelItem.ID)).ToList();

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationFacilities_Should_Succeed(Db db, Accommodation accommodation)
        {
            // Arrange
            var hotelItem = new DbItem("Penthouse");
            db.Add(hotelItem);
            var hotelBedsCode = "ABC123";

            accommodation.BoardCodes = null;
            accommodation.Rooms = null;

            var itemToUpdate = new AccommodationDbItem("ItemToUpdate");

            var facilityFolderItem =
                new AccommodationFacilitiesFolderDbItem(Destinations.Constants.Fields.AccommodationItem.Facilities);

            var dataFolderItem = new DataFolderDbItem("Data");

            var facilityTypesFolderItem = new FacilityTypesFolderDbItem("FacilityTypesFolder");
            var dict = new Dictionary<string, DbItem>();

            foreach (var facility in accommodation.Facilities)
            {
                var facilityItem = new FacilityDbItem(facility.Code);

                facilityFolderItem.Children.Add(facilityItem);

                var facilityTypesGroupItem = new FacilityTypesGroupDbItem("FacilityTypesGroup");

                SetDbItemValueByFieldName(facilityTypesGroupItem, Destinations.Constants.Fields.DatasourceItem.Code, facility.FacilityGroupCode);

                var facilityTypeItem = new FacilityTypeDbItem(facilityItem.Name);

                SetDbItemValueByFieldName(facilityTypeItem, Destinations.Constants.Fields.DatasourceItem.Code, facility.FacilityCode);

                facilityTypesGroupItem.Children.Add(facilityTypeItem);
                facilityTypesFolderItem.Children.Add(facilityTypesGroupItem);
                dict.Add("/sitecore/content/*[@@templateid ='" + Templates.Data.Id + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesFolder + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityTypesGroup + "' AND @Code = '" + facility.FacilityGroupCode + "']/*[@@templateid = '" + Destinations.Constants.TemplateIds.FacilityType + "' AND @Code = '" + facility.FacilityCode + "']", facilityTypeItem);
            }

            dataFolderItem.Children.Add(facilityTypesFolderItem);

            itemToUpdate.Children.Add(facilityFolderItem);

            db.Add(itemToUpdate);
            db.Add(dataFolderItem);
            foreach (var entry in dict)
            {
                simpleCache.GetCachedValue(entry.Key, Arg.Any<Func<Item>>()).Returns(db.GetItem(entry.Value.ID));
            }

            var itemsToUpdate = new Dictionary<string, Item>()
            {
                { accommodation.Code, db.GetItem(itemToUpdate.ID) }
            };

            masterDataService.GetAccommodations(Arg.Any<string[]>(), null)
                .Returns(new List<Accommodation>() { accommodation });
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);
            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .ReturnsForAnyArgs(db.GetItem(facilityFolderItem.ID));

            var fakeContext = new FakeSiteContext(
                new StringDictionary
                {
                    { "name", "website" },
                    { "rootPath", "/sitecore/content" }
                });

            fakeContext.Database = db.Database;

            // Act
            using (new SiteContextSwitcher(fakeContext))
            using (new SecurityDisabler())
            {
                Context.ContentDatabase = db.Database;

                sut.SyncAccommodationFacilities(hotelBedsCode, db.GetItem(hotelItem.ID)).ToList();

                var modelFacilities = accommodation.Facilities;
                var actual = db.GetItem(facilityFolderItem.ID).Children.ToArray();

                // Assert
                foreach (Item facility in actual)
                {
                    var modelFacility = modelFacilities.First(x =>
                        x.Number == facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value);

                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Number].Value.Should().Be(modelFacility.Number);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Order].Value.Should().Be(modelFacility.Order);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndYesOrNo].Value.Should()
                        .Be(modelFacility.IndYesOrNo.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndFee].Value.Should()
                        .Be(modelFacility.IndFee.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.IndLogic].Value.Should()
                        .Be(modelFacility.IndLogic.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Voucher].Value.Should()
                        .Be(modelFacility.Voucher.GetBoolAsIntegerString());
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.Distance].Value.Should()
                        .Be(modelFacility.Distance);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeFrom].Value.Should()
                        .Be(modelFacility.AgeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.AgeTo].Value.Should()
                        .Be(modelFacility.AgeTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TextValue].Value.Should()
                        .Be(modelFacility.TextValue);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateFrom].Value.Should()
                        .Be(modelFacility.DateFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.DateTo].Value.Should()
                        .Be(modelFacility.DateTo);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeFrom].Value.Should()
                        .Be(modelFacility.TimeFrom);
                    facility.Fields[Destinations.Constants.Fields.AccommodationFacilityItem.TimeTo].Value.Should()
                        .Be(modelFacility.TimeTo);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.Currency].Value.Should()
                        .Be(modelFacility.Currency);
                    facility.Fields[Destinations.Constants.Fields.BaseFacilityItem.ApplicationType].Value.Should()
                        .Be(modelFacility.ApplicationType);
                }
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ReturnsEmptyEnumerable_IfNoAccommodationForCode(Accommodation accommodation)
        {
            // Arrange
            var hotelBedsCode = "ABC123";

            masterDataService.GetAccommodation(hotelBedsCode).ReturnsNull();

            // Act
            var result = sut.SyncAccommodationRooms(accommodation, null);

            // Assert
            Assert.Empty(result);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldLogError_If_ThrowsException(Db db)
        {
            // Arrange
            var hotelItem = new DbItem("Hotel");
            db.Add(hotelItem);

            var accommodation = new Accommodation()
            {
                Boards = new List<Board>() { new Board() { Code = "Test" } },
                Rooms = new List<Room>() { new Room() { Code = "Test" } }
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.When(x => x.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())).Do(x => throw new Exception());

            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).ToList();

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_Should_Succeed(DbWithImageSetting db, Image expectedImage)
        {
            // Arrange
            var hotelItem = new DbItem("Abba Berlin hotel-HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };

            var roomFolderItem = new DbItem("Rooms - HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };
            var roomName = "DOUBLE ECONOMY DBLEY";
            var roomsItem = new DbItem(roomName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                Fields =
                {
                    { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                    { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                }
            };
            roomFolderItem.Add(roomsItem);
            hotelItem.Add(roomFolderItem);
            db.Add(hotelItem);

            var roomTypeItemId = ID.NewID;
            var roomTypeItem = new DbItem(roomName, roomTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomType,
                Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
            };
            db.Add(roomTypeItem);

            var roomCode = "007";
            var accommodation = new Accommodation()
            {
                Rooms = new List<Room>()
                {
                    new Room()
                    {
                        RoomCode = roomCode
                    }
                },
                Images = new List<Image> { expectedImage }
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

            var roomItemInstance = db.GetItem(roomTypeItemId);
            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(
                new Dictionary<string, Item>()
                {
                    { roomCode, roomItemInstance }
                });

            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).ToList();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.Contains(db.GetItem(roomsItem.ID), test);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_RoomFolderCode_GetCodeFromHotel(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9123456";
            // Arrange
            var hotelItem = new DbItem("Abba Berlin hotel-HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code,  expectedCode }
                }
            };

            var roomFolderItem = new DbItem("Rooms - HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };
            var roomName = "DOUBLE ECONOMY DBLEY";
            var roomsItem = new DbItem(roomName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                Fields =
                {
                    { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                    { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                }
            };
            roomFolderItem.Add(roomsItem);
            hotelItem.Add(roomFolderItem);
            db.Add(hotelItem);

            var roomTypeItemId = ID.NewID;
            var roomTypeItem = new DbItem(roomName, roomTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomType,
                Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
            };
            db.Add(roomTypeItem);

            var roomCode = "007";
            var accommodation = new Accommodation()
            {
                Rooms = new List<Room>()
                {
                    new Room()
                    {
                        RoomCode = roomCode
                    }
                },
                Images = new List<Image> { expectedImage },
                Code = expectedCode
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

            var roomItemInstance = db.GetItem(roomTypeItemId);
            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(
                new Dictionary<string, Item>()
                {
                    { roomCode, roomItemInstance }
                });

            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
            var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.NotNull(test);
            Assert.Equal(expectedCode, code);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_RoomFolderCode_CreateAtcomCodeFrom6dHBGcode(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            var hotelItem = new DbItem("Abba Berlin hotel-HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code,  null }
                }
            };

            var roomFolderItem = new DbItem("Rooms - HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };
            var roomName = "DOUBLE ECONOMY DBLEY";
            var roomsItem = new DbItem(roomName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                Fields =
                {
                    { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                    { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                }
            };
            roomFolderItem.Add(roomsItem);
            hotelItem.Add(roomFolderItem);
            db.Add(hotelItem);

            var roomTypeItemId = ID.NewID;
            var roomTypeItem = new DbItem(roomName, roomTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomType,
                Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
            };
            db.Add(roomTypeItem);

            var roomCode = "007";
            var accommodation = new Accommodation()
            {
                Rooms = new List<Room>()
                {
                    new Room()
                    {
                        RoomCode = roomCode
                    }
                },
                Images = new List<Image> { expectedImage },
                Code = expectedCode
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

            var roomItemInstance = db.GetItem(roomTypeItemId);
            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(
                new Dictionary<string, Item>()
                {
                    { roomCode, roomItemInstance }
                });

            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
            var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.NotNull(test);
            Assert.Equal(expectedCode, code);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldCreateLanguageVersions_IfSettingsAreCorrect(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", "de-DE=ALE;fr-FR=FRA;en=ENG"))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomsItem.AddVersion("de-DE");
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), Arg.Any<string>())
                    .Returns(accommodation);

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("de-DE"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "de-DE"));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("fr-FR"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "fr-FR"));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(2);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldNotCreateLanguageVersions_IfSettingsAreInCorrect(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "false"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", "de-DE=ALE;fr-FR=FRA;en=ENG"))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), null)
                    .Returns(accommodation);

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldNotCreateLanguageVersions_IfSettingsAreInCorrect2(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", string.Empty))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), null)
                    .Returns(accommodation);

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldCreateLanguageVersions_IfSettingsAreCorrect2(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DU,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", "de-DE=ALE;fr-FR=FRA;en=ENG"))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), Arg.Any<string>())
                    .Returns(accommodation);

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("fr-FR"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "fr-FR"));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(2);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldNotCreateLanguageVersions_IfLanguageMappingIsEmpty(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DU,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", string.Empty))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), Arg.Any<string>())
                    .Returns(accommodation);

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("fr-FR"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "fr-FR"));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldNotCreateLanguageVersions_IfAccommodationIsNull(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DU,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", "de-DE=ALE;fr-FR=FRA;en=ENG"))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), Arg.Any<string>())
                    .ReturnsNull();

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("fr-FR"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "fr-FR"));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_ShouldNotCreateLanguageVersions_IfErrorIsThrown(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9223344";

            // Arrange
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            using (new SettingsSwitcher("HotelBeds.LanguageMapping", "de-DE=ALE;fr-FR=FRA;en=ENG"))
            {
                var syncDataService = new SyncDataService(masterDataService, dataSourceRepository, searchRepository, logger, integrationService, databaseProvider, simpleCache, indexingService, s3ImageBucketService, httpClientProvider);

                var hotelItem = new DbItem("Abba Berlin hotel-HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };

                var roomFolderItem = new DbItem("Rooms - HBG")
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                    Fields =
                    {
                        { Destinations.Constants.Fields.DatasourceItem.Code, null }
                    }
                };
                var roomName = "DOUBLE ECONOMY DBLEY";
                var roomsItem = new DbItem(roomName)
                {
                    TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                    Fields =
                    {
                        { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                        { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                    }
                };
                roomFolderItem.Add(roomsItem);
                hotelItem.Add(roomFolderItem);
                db.Add(hotelItem);

                var roomTypeItemId = ID.NewID;
                var roomTypeItem = new DbItem(roomName, roomTypeItemId)
                {
                    TemplateID = Destinations.Constants.TemplateIds.RoomType,
                    Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
                };
                db.Add(roomTypeItem);

                var roomCode = "007";
                var accommodation = new Accommodation()
                {
                    Rooms = new List<Room>()
                    {
                        new Room()
                        {
                            RoomCode = roomCode
                        }
                    },
                    Images = new List<Image> { expectedImage },
                    Code = expectedCode
                };

                masterDataService
                    .GetAccommodation(Arg.Any<string>(), Arg.Any<string>())
                    .Throws(new Exception());

                dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));
                databaseProvider.GetItem(roomsItem.ID, Language.Parse("fr-FR"), DatabaseType.Master).Returns(db.GetItem(roomsItem.ID, "fr-FR"));

                var roomItemInstance = db.GetItem(roomTypeItemId);
                simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(new Dictionary<string, Item> { { roomCode, roomItemInstance } });

                // Act
                var test = syncDataService.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
                var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

                // Assert
                logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
                test.Should().NotBeNull();
                expectedCode.Should().BeEquivalentTo(code);
                test.Languages.Length.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_RoomFolderCode_CreateAtcomCodeFrom5dHBGcode(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9012345";

            // Arrange
            var hotelItem = new DbItem("Abba Berlin hotel-HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code,  null }
                }
            };

            var roomFolderItem = new DbItem("Rooms - HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };
            var roomName = "DOUBLE ECONOMY DBLEY";
            var roomsItem = new DbItem(roomName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                Fields =
                {
                    { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                    { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                }
            };
            roomFolderItem.Add(roomsItem);
            hotelItem.Add(roomFolderItem);
            db.Add(hotelItem);

            var roomTypeItemId = ID.NewID;
            var roomTypeItem = new DbItem(roomName, roomTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomType,
                Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
            };
            db.Add(roomTypeItem);

            var roomCode = "007";
            var accommodation = new Accommodation()
            {
                Rooms = new List<Room>()
                {
                    new Room()
                    {
                        RoomCode = roomCode
                    }
                },
                Images = new List<Image> { expectedImage },
                Code = expectedCode
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

            var roomItemInstance = db.GetItem(roomTypeItemId);
            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(
                new Dictionary<string, Item>()
                {
                    { roomCode, roomItemInstance }
                });
            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
            var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.NotNull(test);
            Assert.Equal(expectedCode, code);
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationRooms_RoomFolderCode_UpdateCode(DbWithImageSetting db, Image expectedImage)
        {
            var expectedCode = "X9012345";
            // Arrange
            var hotelItem = new DbItem("Abba Berlin hotel-HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.Accommodation,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code,  null }
                }
            };

            var roomFolderItem = new DbItem("Rooms - HBG")
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoomsFolder,
                Fields =
                {
                    { Destinations.Constants.Fields.DatasourceItem.Code, null }
                }
            };
            var roomName = "DOUBLE ECONOMY DBLEY";
            var roomsItem = new DbItem(roomName)
            {
                TemplateID = Destinations.Constants.TemplateIds.AccommodationRoom,
                Fields =
                {
                    { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, null },
                    { Destinations.Constants.Fields.AccommodationRoomItem.Description, "SpecialRoomDescription" }
                }
            };
            roomFolderItem.Add(roomsItem);
            hotelItem.Add(roomFolderItem);
            db.Add(hotelItem);

            var roomTypeItemId = ID.NewID;
            var roomTypeItem = new DbItem(roomName, roomTypeItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.RoomType,
                Fields = { Destinations.Constants.Fields.AccommodationRoomItem.RoomType, roomTypeItemId.ToString() }
            };
            db.Add(roomTypeItem);

            var roomCode = "007";
            var accommodation = new Accommodation()
            {
                Rooms = new List<Room>()
                {
                    new Room()
                    {
                        RoomCode = roomCode
                    }
                },
                Images = new List<Image> { expectedImage },
                Code = expectedCode
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(db.GetItem(roomFolderItem.ID));

            var roomItemInstance = db.GetItem(roomTypeItemId);
            simpleCache.GetCachedValue(Constants.CacheIdentifiers.RoomTypes, Arg.Any<Func<Dictionary<string, Item>>>()).Returns(
                new Dictionary<string, Item>()
                {
                    { roomCode, roomItemInstance }
                });

            // Act
            var test = sut.SyncAccommodationRooms(accommodation, db.GetItem(hotelItem.ID)).FirstOrDefault();
            var code = test.Parent[Destinations.Constants.Fields.DatasourceItem.Code];

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            Assert.NotNull(test);
            Assert.Equal(expectedCode, code);
        }

        [Fact]
        public void SyncAccommodationImages_ShouldReturnsEmptyEnumerable_IfNoAccommodationForCode()
        {
            // Arrange
            var hotelBedsCode = "ABC123";

            masterDataService.GetAccommodation(hotelBedsCode).ReturnsNull();

            // Act
            var images = sut.SyncAccommodationImages(hotelBedsCode, null).ToList();

            // Assert
            Assert.Empty(images);
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodationImages_ShouldLogError_If_ThrowsException(DbWithImageSetting db, Image expectedImage)
        {
            // Arrange
            var hotelItem = new DbItem("Hotel");
            db.Add(hotelItem);

            var hotelBedsCode = "ABC123";

            var accommodation = new Accommodation()
            {
                Boards = new List<Board>() { new Board() { Code = "Test" } },
                Images = new List<Image> { expectedImage }
            };

            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>())
                .ReturnsNull();

            // Act
            _ = sut.SyncAccommodationImages(hotelBedsCode, db.GetItem(hotelItem.ID)).ToList();

            // Assert
            logger.Received(1).Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void SyncAccommodationImages_Should_Succeed(DbWithImageSetting db, Image expectedImage, ImageDbItem imageDbItem)
        {
            // Arrange
            var hotelItemId = ID.NewID;
            var hotelItem = new DbItem("Hotel", hotelItemId);
            db.Add(hotelItem);

            var hotelBedsCode = "ABC123";
            var imagesFolderItemId = ID.NewID;
            var imagesFolderItem = new DbItem("Images", imagesFolderItemId)
            {
                TemplateID = Destinations.Constants.TemplateIds.ImagesFolder
            };

            var accommodation = new Accommodation()
            {
                Boards = new List<Board>() { new Board() { Code = "Test" } },
                Images = new List<Image> { expectedImage }
            };

            imageDbItem.TemplateID = Destinations.Constants.TemplateIds.ExternalImage;
            imagesFolderItem.Add(imageDbItem);
            db.Add(imagesFolderItem);
            masterDataService
                .GetAccommodation(Arg.Any<string>(), null)
                .Returns(accommodation);

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Is(Destinations.Constants.TemplateIds.ImagesFolder), Arg.Any<Item>())
                .Returns(db.GetItem(imagesFolderItemId));

            dataSourceRepository.GetOrCreateItem(Arg.Any<string>(), Arg.Is(Destinations.Constants.TemplateIds.ExternalImage), Arg.Any<Item>())
                .Returns(db.GetItem(imageDbItem.ID));

            // Act
            _ = sut.SyncAccommodationImages(hotelBedsCode, db.GetItem(hotelItemId)).ToList();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void UpdateMasterIndexes_ShouldNotUpdate_WhenItemIsNull()
        {
            // Arrange
            // Act
            sut.UpdateMasterIndexes(null);

            // Assert
            indexingService.DidNotReceive().UpdateItem(Arg.Any<Item>(), Arg.Any<EasyjetIndexes>());
        }

        [Fact]
        public void UpdateMasterIndexes_ShouldNotUpdate_WhenItemIsNotHotel()
        {
            // Arrange
            var item = new FakeItem()
                .WithTemplate(ID.NewID)
                .ToSitecoreItem();

            // Act
            sut.UpdateMasterIndexes(item);

            // Assert
            indexingService.DidNotReceive().UpdateItem(Arg.Any<Item>(), Arg.Any<EasyjetIndexes>());
        }

        [Fact]
        public void UpdateMasterIndexes_ShouldUpdateDestinationMaster_WhenItemIsHotel()
        {
            // Arrange
            var hotelItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .ToSitecoreItem();

            // Act
            sut.UpdateMasterIndexes(hotelItem);

            // Assert
            indexingService.Received(1).UpdateItem(hotelItem, EasyjetIndexes.DestinationMaster);
        }

        private void SetDbItemValueByFieldName(DbItem dbItem, string fieldName, string fieldValue)
        {
            foreach (var field in dbItem.Fields)
            {
                if (field.Name.Equals(fieldName))
                {
                    field.Value = fieldValue;
                    break;
                }
            }
        }
    }
}
