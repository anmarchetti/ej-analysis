using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelThemesServiceTests
    {
        private readonly IHtmlCacheRepository cache;
        private readonly IHotelThemesService hotelThemesService;
        private readonly IProfileService profileService;
        private readonly IDestinationsLogger logger;
        private readonly FakeSiteContext fakeSiteContext;
        private readonly BaseFactory factory;

        public HotelThemesServiceTests()
        {
            factory = Substitute.For<BaseFactory>();
            profileService = Substitute.For<IProfileService>();
            logger = Substitute.For<IDestinationsLogger>();
            cache = Substitute.For<IHtmlCacheRepository>();
            hotelThemesService = new HotelThemesService(factory, profileService, logger, cache);

            fakeSiteContext = new FakeSiteContext(
                    new Sitecore.Collections.StringDictionary
                    {
                        { "rootPath", "/sitecore/content/" },
                        { "database", "master" },
                        { "name", "website" }
                    });
        }

        [Fact]
        public void GetHotelThemes_ShouldEmptyCollection_IfDataNotExistNotInCacheNotInDatabase()
        {
            // Arrange
            cache.GetItem<IEnumerable<HotelThemeResponseItem>>(Arg.Any<string>()).ReturnsForAnyArgs(l => null);

            using (Db db = new Db { })
            {
                using (new Sitecore.Sites.SiteContextSwitcher(fakeSiteContext))
                {
                    // Act
                    var actual = hotelThemesService.GetHotelThemes();

                    // Assert
                    actual.Should().BeEmpty();
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelThemes_ShouldReturnData_IfItExistsInCache(HotelThemeResponseItem hotelThemeResponseItem)
        {
            // Arrange
            var data = new List<HotelThemeResponseItem>();
            data.Add(hotelThemeResponseItem);

            cache.GetItem<IEnumerable<HotelThemeResponseItem>>(Arg.Any<string>()).ReturnsForAnyArgs(data);

            // Act
            var actual = hotelThemesService.GetHotelThemes();

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetHotelThemes_ShouldReturnData_IfItExistsInDatabase(ID itemId)
        {
            // Arrange
            cache.GetItem<IEnumerable<HotelThemeResponseItem>>(Arg.Any<string>()).ReturnsForAnyArgs(l => null);

            using (Db db = new Db
            {
                new DbTemplate("Hotel Themes Folder", Constants.TemplateIds.HotelThemesFolder),
                new DbItem("Data")
                {
                    new DbItem("Hotel Themes", itemId, Constants.TemplateIds.HotelThemesFolder)
                    {
                        new DbItem("Beach", ID.NewID, Constants.TemplateIds.HotelTheme)
                        {
                            new DbItem("Luxury", ID.NewID, Constants.TemplateIds.ThemeType)
                            {
                            }
                        }
                    }
                }
            })
            {
                using (new Sitecore.Sites.SiteContextSwitcher(fakeSiteContext))
                {
                    // Act
                    var actual = hotelThemesService.GetHotelThemes();

                    // Assert
                    actual.Should().NotBeEmpty();
                    var firstHotelTheme = actual.First();
                    firstHotelTheme.TrackingId.Should().Be("Beach");
                    firstHotelTheme.Types.Should().ContainSingle();
                    firstHotelTheme.Types.First().TrackingId.Should().Be("Luxury");
                }
            }
        }

        [Fact]
        public void GetThemeAndTypeIdsGroupedByTypeCode_ShouldReturnData_IfItExistsInDatabase()
        {
            // Arrange
            string code = "code";
            cache.GetItem<IEnumerable<HotelThemeResponseItem>>(Arg.Any<string>()).ReturnsForAnyArgs(l => null);
            using (var db = new Db())
            {
                var hotelThemesFolderTemplateDbItem = new DbTemplate("Hotel Themes Folder", Constants.TemplateIds.HotelThemesFolder);
                var dataDbItem = new DbItem("Data", ID.NewID, Multisite.Templates.Data.Id);
                var hotelThemesFolderDbItem = new DbItem("Hotel Themes", ID.NewID, Constants.TemplateIds.HotelThemesFolder);
                var hotelThemeDbItem = new DbItem("Beach", ID.NewID, Constants.TemplateIds.HotelTheme);
                var hotelThemeTypeDbItem = new DbItem("Luxury", ID.NewID, Constants.TemplateIds.ThemeType);
                hotelThemeTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = code });
                hotelThemeDbItem.Children.Add(hotelThemeTypeDbItem);
                hotelThemesFolderDbItem.Children.Add(hotelThemeDbItem);
                dataDbItem.Children.Add(hotelThemesFolderDbItem);

                db.Add(hotelThemesFolderTemplateDbItem);
                db.Add(dataDbItem);

                using (new Sitecore.Sites.SiteContextSwitcher(fakeSiteContext))
                {
                    // Act
                    var actual = hotelThemesService.GetThemeAndTypeIdsGroupedByTypeCode(db.GetItem(hotelThemesFolderDbItem.ID).GetSiteInfo().RootPath);

                    // Assert
                    actual.Should().NotBeEmpty();
                    actual[code].ThemeId.Should().Be(hotelThemeDbItem.ID);
                    actual[code].TypeId.Should().Be(hotelThemeTypeDbItem.ID);
                }
            }
        }

        [Theory]
        [AutoData]
        public void GetThemeAndTypeIdsGroupedByTypeCode_ShouldReturnData_IfItExistsInCache(string code)
        {
            // Arrange
            var themeTypeIds = new ThemeTypeIds(null)
            {
                ThemeId = ID.NewID,
                TypeId = ID.NewID
            };

            var data = new Dictionary<string, ThemeTypeIds>();
            data.Add(code, themeTypeIds);

            cache.GetItem<Dictionary<string, ThemeTypeIds>>(Arg.Any<string>()).ReturnsForAnyArgs(data);

            // Act
            var actual = hotelThemesService.GetThemeAndTypeIdsGroupedByTypeCode(null);

            // Assert
            actual.Should().NotBeEmpty();
            actual[code].ThemeId.Should().Be(themeTypeIds.ThemeId);
            actual[code].TypeId.Should().Be(themeTypeIds.TypeId);
        }

        [Theory]
        [AutoData]
        public void GetHotelsWithThemes_ShouldReturnHotelsWithThemes_IfDataExist(Db db, HotelWithThemeRow hotelWithThemeRow)
        {
            // Arrange
            IEnumerable<HotelWithThemeRow> hotels = null;
            cache.GetItem<IEnumerable<HotelWithThemeRow>>(Arg.Any<string>()).Returns(hotels);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelWithThemeRow>>()).Returns(hotels);

            var contextDbItem = new DbItem("Desitnations");

            var themeDbItem = new DbItem("Theme", ID.NewID, Constants.TemplateIds.HotelTheme);
            themeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.HotelThemeCode);
            themeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.HotelThemeName);
            db.Add(themeDbItem);

            var typeDbItem = new DbItem("type", ID.NewID, Constants.TemplateIds.ThemeType);
            typeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.HotelTypeCode);
            typeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.HotelTypeName);
            db.Add(typeDbItem);

            var countryDbItem = new DbItem("Country", ID.NewID, Constants.TemplateIds.Country);
            countryDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.CountryCode);
            countryDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.CountryName);
            contextDbItem.Add(countryDbItem);

            var regionDbItem = new DbItem("Country", ID.NewID, Constants.TemplateIds.RegionPage);
            regionDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.RegionCode);
            regionDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.RegionName);

            var resortDbItem = new DbItem("Country", ID.NewID, Constants.TemplateIds.Resort);
            resortDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.ResortCode);
            resortDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.ResortName);

            var hotelDbItem = new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation);
            hotelDbItem.Fields.Add(Constants.Fields.AccommodationItem.HotelTheme, themeDbItem.ID.ToString());
            hotelDbItem.Fields.Add(Constants.Fields.AccommodationItem.Types, typeDbItem.ID.ToString());
            hotelDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelWithThemeRow.HotelCode);
            hotelDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, hotelWithThemeRow.HotelName);

            resortDbItem.Add(hotelDbItem);
            regionDbItem.Add(resortDbItem);
            countryDbItem.Add(regionDbItem);
            db.Add(contextDbItem);
            var database = Substitute.For<Database>();
            factory.GetDatabase(Arg.Any<string>()).Returns(database);

            database.GetItem(Arg.Any<ID>()).Returns(db.GetItem(contextDbItem.ID));

            // Act
            var actual = hotelThemesService.GetHotelsWithThemes(db.GetItem(contextDbItem.ID)).FirstOrDefault();

            // Assert
            actual.Should().NotBeNull();
            actual.CountryCode.Should().Be(hotelWithThemeRow.CountryCode);
            actual.CountryName.Should().Be(hotelWithThemeRow.CountryName);
            actual.RegionCode.Should().Be(hotelWithThemeRow.RegionCode);
            actual.RegionName.Should().Be(hotelWithThemeRow.RegionName);
            actual.ResortCode.Should().Be(hotelWithThemeRow.ResortCode);
            actual.ResortName.Should().Be(hotelWithThemeRow.ResortName);
            actual.HotelThemeCode.Should().Be(hotelWithThemeRow.HotelThemeCode);
            actual.HotelThemeName.Should().Be(hotelWithThemeRow.HotelThemeName);
            actual.HotelTypeCode.Should().Be(hotelWithThemeRow.HotelTypeCode);
            actual.HotelTypeName.Should().Be(hotelWithThemeRow.HotelTypeName);
            actual.Published.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void BoostHotelThemePatternCard_ShouldReturnFalse_IfPatternCardIsNotAvailable(string hotelType)
        {
            // Arrange
            var data = new Tuple<Item, Item>(null, null);
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<Tuple<Item, Item>>>()).Returns(data);

            // Act
            var actual = hotelThemesService.BoostHotelThemePatternCard(hotelType);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().BeFalse();
        }

        [Fact]
        public void PackageIcon_ReturnsCorrectValuesFromDbItem()
        {
            var key = "key";
            var name = "name";
            var luggageCode = "LUG";

            using (Db db = new Db())
            {
                var luggageItemId = ID.NewID;
                var luggageDbItem = new DbItem("Luggage", luggageItemId);
                luggageDbItem.Fields.Add(Constants.Fields.LuggageItem.Code, luggageCode);
                db.Add(luggageDbItem);

                var packageIconItemId = ID.NewID;
                var packageIconDbItem = new DbItem("PackageIcon", packageIconItemId);
                packageIconDbItem.Fields.Add(Constants.Fields.PackageThemeIcon.Type, key);
                packageIconDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, name);
                packageIconDbItem.Fields.Add(Constants.Fields.PackageThemeIcon.BagType, luggageItemId.ToString());
                db.Add(packageIconDbItem);

                var packageIconItem = db.Database.GetItem(packageIconItemId);
                var result = new PackageIcon(packageIconItem);

                result.Key.Should().Be(key);
                result.Name.Should().Be(name);
                result.LuggageCode.Should().Be(luggageCode);
            }
        }
    }
}