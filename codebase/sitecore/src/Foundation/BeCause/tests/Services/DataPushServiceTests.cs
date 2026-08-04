using System;
using System.Collections.Generic;
using System.Globalization;
using AutoFixture.Xunit2;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.BeCause.Services.Api;
using easyJet.Foundation.BeCause.Settings;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using NSubstitute.ReturnsExtensions;
using Sitecore.ContentSearch.Linq;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Services
{
    public class DataPushServiceTests
    {
        private readonly DataPushService sut;
        private readonly IMasterDataService masterDataService;
        private readonly IBeCauseLogger logger;
        private readonly ISettingsService settingsService;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IDatabaseProvider databaseProvider;

        public DataPushServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            logger = Substitute.For<IBeCauseLogger>();
            settingsService = Substitute.For<ISettingsService>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            sut = new DataPushService(masterDataService, logger, settingsService, destinationsRepository, databaseProvider);
        }

        [Fact]
        public void PushHotelData_ShouldReturnError_IfSettingsAreNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void PushHotelData_ShouldReturnError_IfCustomIdentifierIdIsNull()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = string.Empty
            });

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void PushHotelData_ShouldReturnError_IfErrorIsThrown()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = "id"
            });
            destinationsRepository.GetAllHotels().Throws(new Exception("test"));

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfSettingsAreNotEnabled(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = false,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnNoError(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeFalse();
            message.Should().BeNullOrEmpty();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnNoError2(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Resort, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeFalse();
            message.Should().BeNullOrEmpty();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnNoError3(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Resort, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeFalse();
            message.Should().BeNullOrEmpty();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnErrorIfCountryCodeIsNotValid(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "invalid");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError2(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string street,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, street)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });
            hotelItem.DisplayName.ThrowsForAnyArgs<Exception>();

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnErrorIfMandatoryFieldIsMissing(
            string customIdentifierId,
            string code,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, name)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnErrorIfMandatoryFieldIsMissing2(
            string customIdentifierId,
            string code,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, "lat")
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, "lon")
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Resort, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, name)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfParentCountryNotFound(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfParentRegionNotFound(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors()
                .Returns(new[] { countryFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfParentResortNotFound(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors()
                .Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfCountryCodeIsEmpty(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, string.Empty);

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Returns(new[] { countryFakeItem.ToSitecoreItem(), regionFakeItem.ToSitecoreItem(), resortFakeItem.ToSitecoreItem() });

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void PushHotelData_ShouldReturnError_IfMappingThrowsError(
            string customIdentifierId,
            string code,
            decimal lat,
            decimal lon,
            string city,
            string zip,
            string name)
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings
            {
                IsEnabled = true,
                CustomIdentifierId = customIdentifierId
            });

            var countryFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Country)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.DatasourceItem.Code, "DE");

            var regionFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.RegionPage)
                .WithItemAxes()
                .WithParent(countryFakeItem)
                .WithDisplayName("Region");

            var resortFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Resort)
                .WithItemAxes()
                .WithParent(regionFakeItem)
                .WithDisplayName("Resort");

            var hotelFakeItem = new FakeItem()
                .WithTemplate(Destinations.Constants.TemplateIds.Accommodation)
                .WithParent(resortFakeItem)
                .WithItemAxes()
                .WithField(Destinations.Constants.Fields.AccommodationItem.GiataCode, code)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Latitude, lat.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.Longitude, lon.ToString(CultureInfo.InvariantCulture))
                .WithField(Destinations.Constants.Fields.AccommodationItem.City, city)
                .WithField(Destinations.Constants.Fields.AccommodationItem.Address, string.Empty)
                .WithField(Destinations.Constants.Fields.AccommodationItem.PostalCode, zip)
                .WithDisplayName(name);

            var hotelItem = hotelFakeItem.ToSitecoreItem();
            hotelItem.Axes.GetAncestors().Throws<Exception>();

            databaseProvider.GetItem(hotelItem.ID, DatabaseType.Master).Returns(hotelItem);
            var hints = new List<SearchHit<HotelSyncSearchResultItem>>
            {
                new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem
                {
                    SourceCodes = new[] { code },
                    ItemId = hotelItem.ID,
                }),
            };

            destinationsRepository.GetAllHotels(Arg.Any<string>()).Returns(hints);

            // Act
            var (isFaulted, message) = sut.PushHotelData();

            // Assert
            isFaulted.Should().BeTrue();
            message.Should().NotBeNullOrEmpty();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}