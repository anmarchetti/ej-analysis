using System;
using System.Collections.Generic;
using System.IO;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Services
{
    public class AmazonS3ServiceTests
    {
        private readonly AmazonS3ImageBucketService sut;
        private readonly ISettingsService settingsService;
        private readonly IAmazonS3 amazonS3;

        public AmazonS3ServiceTests()
        {
            settingsService = Substitute.For<ISettingsService>();
            amazonS3 = Substitute.For<IAmazonS3>();
            settingsService.GetSettings().Returns(new S3Settings
            {
                RegionName = "eu-west-1",
                ImageBucketName = "ImageBucket"
            });
            sut = new AmazonS3ImageBucketService(settingsService, amazonS3);
        }

        [Fact]
        public void UploadImages_ShouldThrowArgumentNullException_IfImagesIsNull()
        {
            // Act
            Action actual = () => sut.UploadImages(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void UploadImages_ShouldReturnUploadedImageUrls()
        {
            // Arrange
            var mediaItem = new MediaItem(new FakeItem().WithName("TestImage").ToSitecoreItem());
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).Returns(new PutObjectResponse());
            var images = new List<Image>
            {
                new Image { MediaItem = mediaItem, Version = "small" },
                new Image { MediaItem = mediaItem, Version = "medium" },
                new Image { MediaItem = mediaItem, Version = "large" }
            };

            // Act
            var actual = sut.UploadImages(images);

            // Assert
            amazonS3.Received(images.Count).PutObject(Arg.Any<PutObjectRequest>());
            actual.Should().HaveCount(images.Count);
        }

        [Fact]
        public void UploadImages_ShouldBeEmpty_IfImagesHasNoVersion()
        {
            // Arrange
            var mediaItem = new MediaItem(new FakeItem().WithName("TestImage").ToSitecoreItem());
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).Returns(new PutObjectResponse());
            var images = new List<Image>
            {
                new Image
                {
                    MediaItem = mediaItem,
                    Version = null
                }
            };

            // Act
            var actual = sut.UploadImages(images);

            // Assert
            amazonS3.Received(images.Count).PutObject(Arg.Any<PutObjectRequest>());
            actual.Should().BeEmpty();
        }

        [Fact]
        public void UploadImage_ShouldThrowArgumentNullException_IfImageStreamIsNull()
        {
            // Act
            Action actual = () => sut.UploadImage(null, "key1/image.jpg", "image/png");

            // Assert
            actual.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("imageStream");
        }

        [Fact]
        public void UploadImage_ShouldThrowArgumentNullException_IfS3KeyIsMissing()
        {
            // Arrange
            using (var stream = new MemoryStream(new byte[] { 1, 2, 3 }))
            {
                // Act
                Action actual = () => sut.UploadImage(stream, " ", "image/png");

                // Assert
                actual.Should().Throw<ArgumentNullException>().Which.ParamName.Should().Be("s3Key");
            }
        }

        [Fact]
        public void UploadImage_ShouldUploadWithProvidedContentType_AndReturnS3Url()
        {
            // Arrange
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).Returns(new PutObjectResponse());
            using (var stream = new MemoryStream(new byte[] { 1, 2, 3 }))
            {
                // Act
                var actual = sut.UploadImage(stream, "hotel/small/image.jpg", "image/webp");

                // Assert
                actual.Should().Be("https://ImageBucket.s3-eu-west-1.amazonaws.com/hotel/small/image.jpg");
                amazonS3.Received(1).PutObject(Arg.Is<PutObjectRequest>(r =>
                    r.BucketName == "ImageBucket" &&
                    r.Key == "hotel/small/image.jpg" &&
                    r.ContentType == "image/webp" &&
                    r.InputStream == stream));
            }
        }

        [Fact]
        public void UploadImage_ShouldDefaultContentTypeToJpeg_IfContentTypeIsNull()
        {
            // Arrange
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).Returns(new PutObjectResponse());
            using (var stream = new MemoryStream(new byte[] { 5, 6, 7 }))
            {
                // Act
                _ = sut.UploadImage(stream, "hotel/large/image.jpg", null);

                // Assert
                amazonS3.Received(1).PutObject(Arg.Is<PutObjectRequest>(r =>
                    r.Key == "hotel/large/image.jpg" &&
                    r.ContentType == "image/jpeg"));
            }
        }

        [Fact]
        public void DeleteImages_ShouldThrowArgumentNullException_IfImageUrlsIsNull()
        {
            // Act
            Action actual = () => sut.DeleteImages(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void DeleteImages_ShouldDeleteImages()
        {
            // Arrange
            var bucketName = "test-bucket";
            var region = "eu-west-1";
            var paths = new List<string>
            {
                $"https://{bucketName}.s3-{region}.amazonaws.com/key1/image1.jpg",
                $"https://{bucketName}.s3-{region}.amazonaws.com/key1/image2.jpg",
                $"https://{bucketName}.s3-{region}.amazonaws.com/key1/image3.jpg"
            };
            settingsService.GetSettings().Returns(new S3Settings
            {
                RegionName = region,
                ImageBucketName = bucketName
            });
            amazonS3.DeleteObjects(Arg.Any<DeleteObjectsRequest>()).Returns(new DeleteObjectsResponse());

            // Act
            sut.DeleteImages(paths);

            // Assert
            amazonS3.Received(1).DeleteObjects(Arg.Any<DeleteObjectsRequest>());
        }
    }
}
