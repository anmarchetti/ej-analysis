using System;
using Amazon.S3;
using Amazon.S3.Model;
using easyJet.Foundation.AmazonS3.Models;
using easyJet.Foundation.AmazonS3.Services;
using easyJet.Foundation.SitecoreExtensions.Models;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Services
{
    public class AcmiAmazonS3ServiceTest
    {
        private readonly AmazonS3AcmiBucketService service;
        private readonly ISettingsService settingsService;
        private readonly IAmazonS3 amazonS3;

        public AcmiAmazonS3ServiceTest()
        {
            settingsService = Substitute.For<ISettingsService>();
            amazonS3 = Substitute.For<IAmazonS3>();
            service = new AmazonS3AcmiBucketService(settingsService, amazonS3);
        }

        [Fact]
        public void UploadCsv_ShouldBeFalse_IfIssueWithConfiguration()
        {
            // Arrange
            var csv = CreateCsvFile();
            settingsService.GetSettings().Returns(new S3Settings
            {
                RegionName = "eu-west-1",
                AcmiBucketName = string.Empty
            });
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).ThrowsForAnyArgs(new ArgumentException());
            var serviceS3 = new AmazonS3AcmiBucketService(settingsService, amazonS3);

            // Act
            var actual = serviceS3.UploadFile(csv);

            // Assert
            actual.Should().Be(false);
        }

        [Fact]
        public void UploadCsv_ShouldBeFalse_IfIssueCsv()
        {
            // Arrange
            settingsService.GetSettings().Returns(new S3Settings
            {
                RegionName = "eu-west-1",
                AcmiBucketName = "AcmiBucket"
            });

            // Act
            var actual = service.UploadFile(null);

            // Assert
            actual.Should().Be(false);
        }

        [Fact]
        public void UploadImages_ShouldReturnTrue()
        {
            // Arrange
            var csv = CreateCsvFile();
            settingsService.GetSettings().Returns(new S3Settings
            {
                RegionName = "eu-west-1",
                AcmiBucketName = "AcmiBucket"
            });
            amazonS3.PutObject(Arg.Any<PutObjectRequest>()).ReturnsForAnyArgs(new PutObjectResponse());

            // Act
            var actual = service.UploadFile(csv);

            // Assert
            amazonS3.Received(1).PutObject(Arg.Any<PutObjectRequest>());
            actual.Should().Be(true);
        }

        private static CsvFile CreateCsvFile()
        {
            var mediaItem = new MediaItem(new FakeItem().WithName("test").ToSitecoreItem());
            return new CsvFile(mediaItem);
        }
    }
}
