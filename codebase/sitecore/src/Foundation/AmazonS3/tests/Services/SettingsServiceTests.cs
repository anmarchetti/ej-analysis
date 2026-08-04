using Amazon;
using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Services
{
    public class SettingsServiceTests
    {
        private readonly SettingsService sut;
        private readonly BaseSettings baseSettings;

        public SettingsServiceTests()
        {
            baseSettings = Substitute.For<BaseSettings>();
            sut = new SettingsService(baseSettings);
        }

        [Fact]
        public void GetSettings_ShouldReturn_EmptySettings()
        {
            // Arrange
            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.RegionName.Should().BeNullOrEmpty();
            settings.ImageBucketName.Should().BeNullOrEmpty();
            settings.AcmiBucketName.Should().BeNullOrEmpty();
            settings.ReportPath.Should().BeNullOrEmpty();
            settings.SitecoreImagesPath.Should().BeNullOrEmpty();
            settings.Region.Should().BeNull();
            settings.ImageReportLifeSpanInDays.Should().Be(0);
            settings.AllowDeleteImagesFromS3.Should().BeFalse();
            settings.LargeImageSize.Should().Be(0);
            settings.MediumImageSize.Should().Be(0);
            settings.SmallImageSize.Should().Be(0);
        }

        [Theory]
        [AutoData]
        public void GetSettings_ShouldReturn_Settings(
            string acmiBucketName,
            bool allowDeleteImagesFromS3,
            int imageReportLifeSpan,
            int imageSizeLarge,
            int imageSizeMedium,
            int imageSizeSmall,
            string imageBucketName,
            string reportPath,
            string sitecoreImagesPath)
        {
            // Arrange
            baseSettings.GetSetting(Constants.Settings.AcmiBucketNameSettingsName).Returns(acmiBucketName);
            baseSettings.GetSetting(Constants.Settings.RegionSettingsName).Returns("eu-west-1");
            baseSettings.GetBoolSetting(Constants.Settings.AllowDeleteImagesFromS3SettingsName, Constants.Settings.AllowDeleteImagesFromS3DefaultValue).Returns(allowDeleteImagesFromS3);
            baseSettings.GetSetting(Constants.Settings.ImageBucketNameSettingsName).Returns(imageBucketName);
            baseSettings.GetIntSetting(Constants.Settings.ImageReportLifeSpanInDaysSettingsName, Constants.Settings.ImageReportLifeSpanInDaysDefaultValue).Returns(imageReportLifeSpan);
            baseSettings.GetIntSetting(Constants.Settings.ImageSizeLargeSettingsName, Constants.Settings.LargeImageSizeDefaultValue).Returns(imageSizeLarge);
            baseSettings.GetIntSetting(Constants.Settings.ImageSizeMediumSettingsName, Constants.Settings.MediumImageSizeDefaultValue).Returns(imageSizeMedium);
            baseSettings.GetSetting(Constants.Settings.ReportPathSettingsName).Returns(reportPath);
            baseSettings.GetSetting(Constants.Settings.SitecoreImagesPathSettingsName).Returns(sitecoreImagesPath);
            baseSettings.GetIntSetting(Constants.Settings.ImageSizeSmallSettingsName, Constants.Settings.SmallImageSizeDefaultValue).Returns(imageSizeSmall);

            // Act
            var settings = sut.GetSettings();

            // Assert
            settings.Should().NotBeNull();
            settings.RegionName.Should().Be("eu-west-1");
            settings.ImageBucketName.Should().Be(imageBucketName);
            settings.AcmiBucketName.Should().Be(acmiBucketName);
            settings.ReportPath.Should().Be(reportPath);
            settings.SitecoreImagesPath.Should().Be(sitecoreImagesPath);
            settings.Region.Should().Be(RegionEndpoint.EUWest1);
            settings.ImageReportLifeSpanInDays.Should().Be(imageReportLifeSpan);
            settings.AllowDeleteImagesFromS3.Should().Be(allowDeleteImagesFromS3);
            settings.LargeImageSize.Should().Be(imageSizeLarge);
            settings.MediumImageSize.Should().Be(imageSizeMedium);
            settings.SmallImageSize.Should().Be(imageSizeSmall);
        }
    }
}