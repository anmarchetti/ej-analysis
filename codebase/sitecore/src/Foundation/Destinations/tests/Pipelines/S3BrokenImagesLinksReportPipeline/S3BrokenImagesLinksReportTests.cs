using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.Destinations.Pipelines.S3BrokenImagesLinksReport;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Processors;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Pipelines.S3BrokenImagesLinksReportPipeline
{
    public class S3BrokenImagesLinksReportTests
    {
        private const string HbgImagePrefix = "https://photos.hotelbeds.com";
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDestinationsLogger logger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly BaseSettings settings;
        private readonly IImagesService imagesService;
        private readonly BaseMediaManager mediaManager;

        public S3BrokenImagesLinksReportTests()
        {
            databaseProvider = Substitute.For<IDatabaseProvider>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            settings = Substitute.For<BaseSettings>();
            imagesService = Substitute.For<IImagesService>();
            mediaManager = Substitute.For<BaseMediaManager>();
        }

        [Fact]
        public void ReportName_ReturnsCorrectName()
        {
            // Arrange
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.ReportNameProxy;

            // Assert
            result.Should().StartWith("BrokenImagesLinksReport_S3");
        }

        [Fact]
        public void ReportFolder_ShouldReturnNull_IfSettingsNotConfigured()
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.BrokenLinksReportPathSettingsName).Returns(string.Empty);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.ReportFolderProxy;

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [InlineData("/sitecore/test")]
        public void ReportFolder_ShouldReturnNull_IfSettingsAreConfigured(string path)
        {
            // Arrange
            var reportFolderFakeItem = new FakeItem().WithPath(path);
            settings.GetSetting(Constants.BrokenLinksReport.BrokenLinksReportPathSettingsName).Returns(path);
            databaseProvider.GetItem(path, DatabaseType.Master).Returns(reportFolderFakeItem.ToSitecoreItem());

            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.ReportFolderProxy;

            // Assert
            result.Should().NotBeNull();
        }

        [Theory]
        [InlineData("https://photos.hotelbeds.com/giata/23/230739/230739a_hb_p_003.jpg")]
        [InlineData("https://photos.hotelbeds.com/giata/bigger/23/230739/230739a_hb_p_003.jpg")]
        [InlineData("https://photos.hotelbeds.com/giata/xl/23/230739/230739a_hb_p_003.jpg")]
        public void IsHbgImage_ShouldReturnTrue_IfImagesStartsWithCorrectUrl(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.IsHbgImageProxy(imageUrl);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/small/img.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/medium/img.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/large/img.jpg")]
        public void IsHbgImage_ShouldReturnTrue_ForHbgS3Urls(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            settings.GetSetting(Constants.BrokenLinksReport.HbgS3KeyPrefixSettingName, "hbg").Returns("hbg");
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.IsHbgImageProxy(imageUrl);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [InlineData("https://photos.hotelbeds.com/giata/23/230739/230739a_hb_p_003.jpg")]
        [InlineData("https://photos.hotelbeds.com/giata/bigger/23/230739/230739a_hb_p_003.jpg")]
        [InlineData("https://photos.hotelbeds.com/giata/xl/23/230739/230739a_hb_p_003.jpg")]
        public void FilterImageByType_ShouldReturnFalse_IfImagesStartWithHbgPrefix(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.FilterImageByImageTypeProxy(imageUrl);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/small/img.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/medium/img.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/hbg/18692/large/img.jpg")]
        public void FilterImageByType_ShouldReturnFalse_ForHbgS3Urls(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            settings.GetSetting(Constants.BrokenLinksReport.HbgS3KeyPrefixSettingName, "hbg").Returns("hbg");
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.FilterImageByImageTypeProxy(imageUrl);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/small/3234_01.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/medium/3234_01.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/large/3234_01.jpg")]
        public void IsHbgImage_ShouldReturnFalse_IfImagesStartsWithIncorrectUrl(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.IsHbgImageProxy(imageUrl);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/small/3234_01.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/medium/3234_01.jpg")]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/large/3234_01.jpg")]
        public void FilterImageByType_ShouldReturnTrue_IfImagesDoNotStartWithHbgPrefix(string imageUrl)
        {
            // Arrange
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.FilterImageByImageTypeProxy(imageUrl);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/small/3234_01.jpg", Constants.Fields.ExternalImageItem.Small)]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/medium/3234_01.jpg", Constants.Fields.ExternalImageItem.Medium)]
        [InlineData("https://easyjet-holidays-images-prod.s3-eu-west-1.amazonaws.com/3234_-_IBEROSTAR_Playa_Gaviotas/large/3234_01.jpg", Constants.Fields.ExternalImageItem.Large)]
        public void FilterImageItems_ShouldReturnTrue_IfImagesDoNotStartWithHbgPrefix(string imageUrl, string fieldName)
        {
            // Arrange
            var imageItem = new FakeItem().WithField(fieldName, imageUrl).ToSitecoreItem();
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.FilterImageItemsProxy(imageItem);

            // Assert
            result.Should().BeTrue();
        }

        [Theory]
        [InlineData("https://photos.hotelbeds.com/giata/23/230739/230739a_hb_p_003.jpg", Constants.Fields.ExternalImageItem.Small)]
        [InlineData("https://photos.hotelbeds.com/giata/bigger/23/230739/230739a_hb_p_003.jpg", Constants.Fields.ExternalImageItem.Medium)]
        [InlineData("https://photos.hotelbeds.com/giata/xl/23/230739/230739a_hb_p_003.jpg", Constants.Fields.ExternalImageItem.Large)]
        public void FilterImageItems_ShouldReturnTrue_IfImagesStartWithHbgPrefix(string imageUrl, string fieldName)
        {
            // Arrange
            var imageItem = new FakeItem().WithField(fieldName, imageUrl).ToSitecoreItem();
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.FilterImageItemsProxy(imageItem);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void CreateReport_ShouldReturnNull_IfAnyParameterIsNull()
        {
            // Arrange
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportProxy(null, null, null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CreateReport_ShouldReturnNull_IfAnyParameterIsNull2()
        {
            // Arrange
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportProxy(new List<Item>(), null, null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CreateReport_ShouldReturnNull_IfAnyParameterIsNull3()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportProxy(new List<Item> { item }, null, null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CreateReport_ShouldReturnNull_IfAnyParameterIsNull4()
        {
            // Arrange
            var item = new FakeItem().ToSitecoreItem();
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportProxy(new List<Item> { item }, item, string.Empty);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [InlineData("test", "/sitecore/media library")]
        public void CreateReport_ShouldReturnReport_IfDataIsValid(string reportName, string mediaPath)
        {
            // Arrange
            var imageItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().ToSitecoreItem();
            var reportFolderItem = new FakeItem().ToSitecoreItem();
            var reportItem = new FakeItem().WithTemplate(TemplateIDs.UnversionedFile).WithPath(mediaPath).ToSitecoreItem();
            var media = Substitute.For<Media>();
            datasourceRepository.GetOrCreateItem(reportName, TemplateIDs.UnversionedFile, reportFolderItem).Returns(reportItem);
            mediaManager.GetMedia(Arg.Any<MediaItem>()).ReturnsForAnyArgs(media);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportProxy(new List<Item> { imageItem }, reportFolderItem, reportName);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public void CreateReportRecord_ShouldReturnNull_IfImageItemIsNull()
        {
            // Arrange
            var imageItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().ToSitecoreItem();
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportRecordProxy(null);

            // Assert
            result.Should().BeNull();
        }

        [Theory]
        [InlineData("ESFU0063", "https://photos.hotelbeds.com/giata/00/000764/000764a_hb_ro_050.jpg", "1290350", "ESFU", "ES", "ESFUCF", "Arena Castillo")]
        [InlineData("", "", "", "", "", "", "")]
        public void CreateReportRecord_ShouldReturnReportRecord_IfImageItemIsCorrect(
            string atcomCode,
            string imageUrl,
            string giataCode,
            string regionCode,
            string countryCode,
            string resortCode,
            string hotelName)
        {
            // Arrange
            var countryFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Country).WithName("Country").WithField(Constants.Fields.DatasourceItem.Code, countryCode).WithField(Constants.Fields.DatasourceItem.Name, "Country");
            var regionFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionPage).WithParent(countryFakeItem).WithName("Region").WithField(Constants.Fields.DatasourceItem.Code, regionCode).WithField(Constants.Fields.DatasourceItem.Name, "Region");
            var resortFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Resort).WithParent(regionFakeItem).WithName("Resort").WithField(Constants.Fields.DatasourceItem.Code, resortCode).WithField(Constants.Fields.DatasourceItem.Name, "Resort");
            var hotelFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithParent(resortFakeItem).WithName(hotelName).WithField(Constants.Fields.AccommodationItem.GiataCode, giataCode);
            var roomFolderFakeItem = new FakeItem().WithName("Rooms - DC").WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder).WithField(Constants.Fields.DatasourceItem.Code, atcomCode).WithParent(hotelFakeItem);
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithField(Constants.Fields.ExternalImageItem.Small, imageUrl).WithName("Image").WithParent(hotelFakeItem);
            var imageItem = imageFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            imageItem.Axes.GetAncestors().Returns(new[] { hotelItem });
            databaseProvider.GetItem(imageFakeItem.ID, DatabaseType.Web).Returns(imageFakeItem);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportRecordProxy(imageItem);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Image");
            result.AtcomCodes.Should().Be(atcomCode);
            result.CountryCode.Should().Be(countryCode);
            result.CountryName.Should().Be("Country");
            result.RegionCode.Should().Be(regionCode);
            result.RegionName.Should().Be("Region");
            result.ResortCode.Should().Be(resortCode);
            result.ResortName.Should().Be("Resort");
            result.HotelName.Should().Be(hotelName);
            result.Giata.Should().Be(giataCode);
            result.Published.Should().Be("yes");
            result.Size.Should().Be(Constants.Fields.ExternalImageItem.Small);
            result.Type.Should().Be("Hotel Image");
        }

        [Fact]
        public void CreateReportRecord_ShouldReturnReportRecord_IfDataIsIncomplete()
        {
            // Arrange
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithName("Image");
            var imageItem = imageFakeItem.ToSitecoreItem();
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.CreateReportRecordProxy(imageItem);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Image");
            result.AtcomCodes.Should().BeNullOrEmpty();
            result.CountryCode.Should().BeNullOrEmpty();
            result.CountryName.Should().BeNullOrEmpty();
            result.RegionCode.Should().BeNullOrEmpty();
            result.RegionName.Should().BeNullOrEmpty();
            result.ResortCode.Should().BeNullOrEmpty();
            result.ResortName.Should().BeNullOrEmpty();
            result.HotelName.Should().BeNullOrEmpty();
            result.Giata.Should().BeNullOrEmpty();
            result.Published.Should().Be("no");
            result.Size.Should().Be(Constants.Fields.ExternalImageItem.Small);
            result.Type.Should().Be("Hotel Image");
        }

        [Fact]
        public void Process_ShouldDoNothing_IfArgsAreNull()
        {
            // Arrange
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(null);

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfParentIsNull()
        {
            // Arrange
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(new DestinationPipelineArgs { Parent = null });

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldDoNothing_IfExceptionIsThrown()
        {
            // Arrange
            var parentItem = new FakeItem().ToSitecoreItem();
            destinationsRepository.GetAllHotels(Arg.Any<string>()).ThrowsForAnyArgs(new Exception());
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(new DestinationPipelineArgs { Parent = parentItem });

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [InlineData("https://photos.hotelbeds.com/giata/00/000764/000764a_hb_ro_050.jpg")]
        public void Process_ShouldDoNothing_IfNoImagesAreFound(string imageUrl)
        {
            // Arrange
            var rootItemParent = new FakeItem().WithPath("/");
            var rootItem = new FakeItem().WithParent(rootItemParent).ToSitecoreItem();
            var hotelFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithUri();
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithField(Constants.Fields.ExternalImageItem.Small, imageUrl).WithName("Image").WithParent(hotelFakeItem);
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(hotelItem);
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>();

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(new DestinationPipelineArgs { Parent = rootItem });

            // Assert
            logger.Received(4).Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [InlineData("ESFU0063", "https://photos.hotelbeds.com/giata/00/000764/000764a_hb_ro_050.jpg", "1290350", "ESFU", "ES", "ESFUCF", "Arena Castillo")]
        public void Process_ShouldDoNothing_IfReportFolderIsNotFound(
            string atcomCode,
            string imageUrl,
            string giataCode,
            string regionCode,
            string countryCode,
            string resortCode,
            string hotelName)
        {
            // Arrange
            var countryFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Country).WithName("Country").WithField(Constants.Fields.DatasourceItem.Code, countryCode).WithField(Constants.Fields.DatasourceItem.Name, "Country");
            var regionFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionPage).WithParent(countryFakeItem).WithName("Region").WithField(Constants.Fields.DatasourceItem.Code, regionCode).WithField(Constants.Fields.DatasourceItem.Name, "Region");
            var resortFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Resort).WithParent(regionFakeItem).WithName("Resort").WithField(Constants.Fields.DatasourceItem.Code, resortCode).WithField(Constants.Fields.DatasourceItem.Name, "Resort");
            var hotelFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithUri().WithItemAxes().WithParent(resortFakeItem).WithName(hotelName).WithField(Constants.Fields.AccommodationItem.GiataCode, giataCode);
            var roomFolderFakeItem = new FakeItem().WithName("Rooms - DC").WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder).WithField(Constants.Fields.DatasourceItem.Code, atcomCode).WithParent(hotelFakeItem);
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithField(Constants.Fields.ExternalImageItem.Small, imageUrl).WithName("Image").WithParent(hotelFakeItem);
            var imageItem = imageFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetDescendants().Returns(new[] { imageFakeItem.ToSitecoreItem() });
            imageItem.Axes.GetAncestors().Returns(new[] { hotelItem });
            databaseProvider.GetItem(imageFakeItem.ID, DatabaseType.Web).Returns(imageFakeItem);
            var rootItemParent = new FakeItem().WithPath("/");
            var rootItem = new FakeItem().WithParent(rootItemParent).ToSitecoreItem();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(hotelItem);
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>(), BrokenImagesLinksReportProcessorBase.GetAllHotelsBatchSize).Returns(hints);
            imagesService.CheckIfImageIsBroken(imageUrl).Returns(true);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(new DestinationPipelineArgs { Parent = rootItem });

            // Assert
            logger.Received(3).Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [InlineData("ESFU0063", "https://photos.hotelbeds.com/giata/00/000764/000764a_hb_ro_050.jpg", "1290350", "ESFU", "ES", "ESFUCF", "Arena Castillo")]
        public void Process_ShouldCreateReport(
        string atcomCode,
        string imageUrl,
        string giataCode,
        string regionCode,
        string countryCode,
        string resortCode,
        string hotelName)
        {
            // Arrange
            var countryFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Country).WithName("Country").WithField(Constants.Fields.DatasourceItem.Code, countryCode).WithField(Constants.Fields.DatasourceItem.Name, "Country");
            var regionFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.RegionPage).WithParent(countryFakeItem).WithName("Region").WithField(Constants.Fields.DatasourceItem.Code, regionCode).WithField(Constants.Fields.DatasourceItem.Name, "Region");
            var resortFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Resort).WithParent(regionFakeItem).WithName("Resort").WithField(Constants.Fields.DatasourceItem.Code, resortCode).WithField(Constants.Fields.DatasourceItem.Name, "Resort");
            var hotelFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithUri().WithParent(resortFakeItem).WithName(hotelName).WithField(Constants.Fields.AccommodationItem.GiataCode, giataCode);
            var roomFolderFakeItem = new FakeItem().WithName("Rooms - DC").WithTemplate(Constants.TemplateIds.AccommodationRoomsFolder).WithField(Constants.Fields.DatasourceItem.Code, atcomCode).WithParent(hotelFakeItem);
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithField(Constants.Fields.ExternalImageItem.Small, imageUrl).WithName("Image").WithParent(hotelFakeItem);
            var imageItem = imageFakeItem.ToSitecoreItem();
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            imageItem.Axes.GetAncestors().Returns(new[] { hotelItem });
            databaseProvider.GetItem(imageFakeItem.ID, DatabaseType.Web).Returns(imageFakeItem);
            var rootItemParent = new FakeItem().WithPath("/");
            var rootItem = new FakeItem().WithParent(rootItemParent).ToSitecoreItem();
            databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(hotelItem);
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var reportFolderItem = new FakeItem().ToSitecoreItem();
            var reportItem = new FakeItem().WithTemplate(TemplateIDs.UnversionedFile).WithPath("/sitecore/media library/").ToSitecoreItem();
            var media = Substitute.For<Media>();
            datasourceRepository.GetOrCreateItem(Arg.Any<string>(), TemplateIDs.UnversionedFile, reportFolderItem).ReturnsForAnyArgs(reportItem);
            mediaManager.GetMedia(Arg.Any<MediaItem>()).ReturnsForAnyArgs(media);
            settings.GetSetting(Constants.BrokenLinksReport.BrokenLinksReportPathSettingsName).Returns("/sitecore/test");
            databaseProvider.GetItem("/sitecore/test", DatabaseType.Master).Returns(reportFolderItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);
            imagesService.CheckIfImageIsBroken(imageUrl).Returns(true);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            sut.ProcessProxy(new DestinationPipelineArgs { Parent = rootItem });

            // Assert
            logger.Received(4).Info(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [InlineData("https://photos.hotelbeds.com/giata/00/000764/000764a_hb_ro_050.jpg")]
        public void GetAllImageItemsProxy_ShouldReturn_Images(string imageUrl)
        {
            // Arrange
            var rootItemParent = new FakeItem().WithPath("/");
            var rootItem = new FakeItem().WithParent(rootItemParent).ToSitecoreItem();
            var hotelFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.Accommodation).WithUri().WithItemAxes();
            var imageFakeItem = new FakeItem().WithTemplate(Constants.TemplateIds.ExternalImage).WithItemAxes().WithField(Constants.Fields.ExternalImageItem.Small, imageUrl).WithName("Image").WithParent(hotelFakeItem);
            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetDescendants().Returns(new[] { imageFakeItem.ToSitecoreItem() });
            databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(hotelItem);
            settings.GetSetting(Constants.BrokenLinksReport.ImageSizeSmallPrefixUrlSettingsName).Returns(HbgImagePrefix);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>(), BrokenImagesLinksReportProcessorBase.GetAllHotelsBatchSize).Returns(hints);
            var sut = new S3BrokenImagesLinksReportProxy(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService);

            // Act
            var result = sut.GetAllImageItemsProxy(rootItem);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().HaveCount(1);
        }

        public class S3BrokenImagesLinksReportProxy : S3BrokenImagesLinksReport
        {
            public S3BrokenImagesLinksReportProxy(
                IDatabaseProvider databaseProvider,
                IDestinationsRepository destinationsRepository,
                IDestinationsLogger logger,
                IDatasourceRepository datasourceRepository,
                BaseSettings settings,
                BaseMediaManager mediaManager,
                IImagesService imagesService)
                : base(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService)
            {
            }

            public List<Item> GetAllImageItemsProxy(Item rootItem) => GetAllImageItems(rootItem);

            public string ReportNameProxy => ReportName;

            public Item ReportFolderProxy => ReportFolder;

            public void ProcessProxy(DestinationPipelineArgs args) => Process(args);

            public BrokenImageRecord CreateReportRecordProxy(Item imageItem) => CreateReportRecord(imageItem);

            public Item CreateReportProxy(List<Item> items, Item reportFolder, string reportName) => CreateReport(items, reportFolder, reportName);

            public bool FilterImageItemsProxy(Item imageItem) => FilterImageItems(imageItem);

            public bool FilterImageByImageTypeProxy(string imageUrl) => FilterImageByImageType(imageUrl);

            public bool IsHbgImageProxy(string imageUrl) => IsHbgImage(imageUrl);
        }
    }
}