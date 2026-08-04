using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Queries;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using Newtonsoft.Json;
using NSubstitute;
using NSubstitute.ReceivedExtensions;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Sitecore.NSubstituteUtils.Extensions;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class DestinationsSearchServiceTests
    {
        private const int ChunkSize = 1;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly HtmlCacheRepository cache;
        private readonly DestinationsSearchService destinationsSearchService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly BaseSettings baseSettings;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IFacilityMatrixService facilitMatrixService;

        public DestinationsSearchServiceTests()
        {
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            cache = Substitute.ForPartsOf<HtmlCacheRepository>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            baseSettings = Substitute.For<BaseSettings>();
            baseSettings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(ChunkSize);
            databaseProvider = Substitute.For<IDatabaseProvider>();
            facilitMatrixService = Substitute.For<IFacilityMatrixService>();
            destinationsSearchService = new DestinationsSearchService(baseSettings, destinationsRepository, cache, databaseProvider, facilitMatrixService, destinationsLogger);
        }

        [Theory]
        [InlineData(10, new string[] { "code1", "code2" })]
        public void GetDestinationsByAirportCodes_ShouldReturnDestinations_IfDestinationsExist(int resultSeachesChunkSize, string[] codes)
        {
            // Arrange
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(new List<string>());

            var hints = new List<SearchHit<DestinationSearchResultItem>>();

            for (int i = 0; i < resultSeachesChunkSize; i++)
            {
                hints.Add(new SearchHit<DestinationSearchResultItem>(i, new DestinationSearchResultItem() { Code = i.ToString(), ItemId = ID.NewID }));
            }

            var searches = new SearchResults<DestinationSearchResultItem>(hints, resultSeachesChunkSize);

            destinationsRepository.GetDestinationsByAirportCodes(Arg.Any<DestinationByCodeQueryArgs>())
                .Returns(searches);

            // Act
            var actual = destinationsSearchService.GetDestinationsByAirportCodes(
                new DestinationByCodeQueryArgs
                {
                    Codes = codes
                });

            // Assert
            actual.Destinations.Count.Should().Be(resultSeachesChunkSize);
        }

        [Fact]
        public void GetDestinationsByAirportCodes_ContainsVirtualCountry_ShouldReturnResoertDestinations()
        {
            // Arrange
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(new List<string>());

            var primarySearches = new SearchResults<DestinationSearchResultItem>(
                new[]
                {
                    new SearchHit<DestinationSearchResultItem>(0, new DestinationSearchResultItem()
                    {
                        Code = "VABCD",
                        ItemId = ID.NewID,
                        TemplateId = Constants.TemplateIds.VirtualCountry,
                        AirportCodes = new[] { "ABC", "DEF" }
                    })
                }, 1);

            var secondarySearches = new SearchResults<DestinationSearchResultItem>(
                new[]
                {
                    new SearchHit<DestinationSearchResultItem>(0, new DestinationSearchResultItem()
                    {
                        Code = "ABCDEF",
                        ItemId = ID.NewID,
                        TemplateId = Constants.TemplateIds.Resort,
                        AirportCodes = new[] { "ABC" }
                    })
                }, 1);

            destinationsRepository
                .GetDestinationsByAirportCodes(Arg.Is<DestinationByCodeQueryArgs>(x => !x.Filter.HasFlag(DestinationFilter.Resort)))
                .Returns(primarySearches);

            destinationsRepository
                .GetDestinationsByAirportCodes(Arg.Is<DestinationByCodeQueryArgs>(x => x.Filter.HasFlag(DestinationFilter.Resort)))
                .Returns(secondarySearches);

            // Act
            var actual = destinationsSearchService.GetDestinationsByAirportCodes(
                new DestinationByCodeQueryArgs
                {
                    Codes = new[] { "ABC" }
                });

            // Assert
            actual.Destinations.Count.Should().Be(2);
            actual.Destinations[0].Code.Should().Be("VABCD");
            actual.Destinations[1].Code.Should().Be("ABCDEF");
        }

        [Theory]
        [InlineData(10, new string[] { "code1", "code2" }, "suggestedQuery", "query")]
        public void GetDestinationsByAirportCodes_ShouldUseSpellCheckedQuery_WhenSpellCheckHasSuggestions(int resultSeachesChunkSize, string[] codes, string suggestedQuery, string query)
        {
            // Arrange
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(new List<string> { suggestedQuery });

            var hints = new List<SearchHit<DestinationSearchResultItem>>();

            for (int i = 0; i < resultSeachesChunkSize; i++)
            {
                hints.Add(new SearchHit<DestinationSearchResultItem>(i, new DestinationSearchResultItem() { Code = i.ToString(), ItemId = ID.NewID }));
            }

            var searches = new SearchResults<DestinationSearchResultItem>(hints, resultSeachesChunkSize);

            destinationsRepository.GetDestinationsByAirportCodes(Arg.Is<DestinationByCodeQueryArgs>(x => x.Query == suggestedQuery))
                .Returns(searches);

            var emptySearches = new SearchResults<DestinationSearchResultItem>(new List<SearchHit<DestinationSearchResultItem>>(), 0);
            destinationsRepository.GetDestinationsByAirportCodes(Arg.Is<DestinationByCodeQueryArgs>(x => x.Query == query))
               .Returns(emptySearches);

            // Act
            var actual = destinationsSearchService.GetDestinationsByAirportCodes(
                new DestinationByCodeQueryArgs
                {
                    Codes = codes,
                    Query = query
                });

            // Assert
            actual.Destinations.Count.Should().Be(resultSeachesChunkSize);
            destinationsRepository.Received(1).SpellCheck(query, 1);
        }

        [Fact]
        public void GetDestinationsByAirportCodes_WithCodesLengthLessThanChunkSize_DoesNotDivideByZero()
        {
            // Arrange
            var localDestinationsRepository = Substitute.For<IDestinationsRepository>();
            var localCache = Substitute.ForPartsOf<HtmlCacheRepository>();
            var localDestinationsLogger = Substitute.For<IDestinationsLogger>();
            var localBaseSettings = Substitute.For<BaseSettings>();
            var localDatabaseProvider = Substitute.For<IDatabaseProvider>();
            var localFacilitMatrixService = Substitute.For<IFacilityMatrixService>();

            localBaseSettings.GetIntSetting(Arg.Any<string>(), Arg.Any<int>()).Returns(10);

            var service = new DestinationsSearchService(
                localBaseSettings,
                localDestinationsRepository,
                localCache,
                localDatabaseProvider,
                localFacilitMatrixService,
                localDestinationsLogger);

            localDestinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(new List<string>());
            localDestinationsRepository.GetDestinationsByAirportCodes(Arg.Any<DestinationByCodeQueryArgs>())
                .Returns(new SearchResults<DestinationSearchResultItem>(new List<SearchHit<DestinationSearchResultItem>>(), 0));

            // Act
            Action action = () => service.GetDestinationsByAirportCodes(new DestinationByCodeQueryArgs
            {
                Codes = new[] { "ABC" },
                Take = 5,
            });

            // Assert
            action.Should().NotThrow();
            localDestinationsRepository.Received(1).GetDestinationsByAirportCodes(
                Arg.Is<DestinationByCodeQueryArgs>(x => x.Codes.Length == 1 && x.Take == 5));
        }

        [Theory]
        [AutoData]
        public void GetAllCountries_ShouldReturnAllCountries_IfCountriesExists(string countryCode, string virtualCountryCode, string regionCode, string resortCode)
        {
            // Arrange
            DestinationsSearchResponse response = null;
            cache.GetItem<DestinationsSearchResponse>(Arg.Any<string>()).Returns(response);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<DestinationsSearchResponse>()).Returns(response);

            var country = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Country,
                Code = countryCode,
                Children = new string[0],
                Parents = null
            };

            var region = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Region,
                Code = regionCode,
                Children = new string[0],
                Parents = new string[] { JsonConvert.SerializeObject(new ChildDestination(country)) },
            };

            var resort = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Resort,
                Code = resortCode,
                Children = new string[0],
                Parents = new string[] { JsonConvert.SerializeObject(new ChildDestination(region)), JsonConvert.SerializeObject(new ChildDestination(country)) }
            };

            var virtualCountry = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.VirtualCountry,
                Code = virtualCountryCode,
                RelatedRegions = new string[] { regionCode },
                Children = new string[] { JsonConvert.SerializeObject(new ChildDestination(resort)) },
                Parents = new string[] { JsonConvert.SerializeObject(new ChildDestination(country)) }
            };

            var countries = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>()
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1, country),
                    new SearchHit<BaseDestinationsSearchResultItem>(1, virtualCountry)
                }, 2);

            var resorts = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>()
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1, resort)
                }, 1);

            destinationsRepository.GetAllCountries(true, true).Returns(countries);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(resorts);

            // Act
            var actual = destinationsSearchService.GetAllCountries(true, true);

            // Assert
            actual.Should().NotBeNull();
            actual.Destinations.Should().HaveCount(2);
            actual.Destinations.ElementAt(0).Code.Should().Be(countryCode);
            actual.Destinations.ElementAt(1).Code.Should().Be(virtualCountryCode);
            actual.Destinations.ElementAt(1).Children.ElementAt(0).Code.Should().Be(resortCode);
            actual.Destinations.ElementAt(1).Children.ElementAt(0).Parents.Should().HaveCount(2);
            actual.Destinations.ElementAt(1).Children.ElementAt(0).Parents.ElementAt(0).Type.Should().Be(Constants.TemplateNames.Region);
            actual.Destinations.ElementAt(1).Children.ElementAt(0).Parents.ElementAt(1).Type.Should().Be(Constants.TemplateNames.Country);
        }

        [Fact]
        public void GetAllCountries_ShouldReturnCachedData_IfCacheContainsResponse()
        {
            // Arrange
            var cachedResponse = new DestinationsSearchResponse(new[]
            {
                new ChildDestination { Code = "cached-country" }
            });

            cache.GetItem<DestinationsSearchResponse>(Arg.Any<string>()).Returns(cachedResponse);

            // Act
            var actual = destinationsSearchService.GetAllCountries(true, true);

            // Assert
            actual.Should().BeSameAs(cachedResponse);
            destinationsRepository.DidNotReceive().GetAllCountries(Arg.Any<bool>(), Arg.Any<bool>());
        }

        [Fact]
        public void GetAllCountries_ShouldNotStoreCache_WhenNoCountriesFound()
        {
            // Arrange
            cache.GetItem<DestinationsSearchResponse>(Arg.Any<string>()).Returns((DestinationsSearchResponse)null);

            var emptyCountries = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>(),
                0);
            var emptyResorts = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>(),
                0);

            destinationsRepository.GetAllCountries(false, true).Returns(emptyCountries);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(emptyResorts);

            // Act
            var actual = destinationsSearchService.GetAllCountries(false, true);

            // Assert
            actual.Should().NotBeNull();
            actual.Destinations.Should().BeEmpty();
            cache.DidNotReceive().StoreItem(Arg.Any<string>(), Arg.Any<DestinationsSearchResponse>());
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldBeEmpty_IfParentItemNotExists(string code)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            BaseDestinationsSearchResultItem parentItem = null;

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldReturnHotels_IfCountriesExists(string code, ID id)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            var hotelSearchResultItems = new SearchResults<HotelSearchResultItem>(
                new SearchHit<HotelSearchResultItem>[]
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        IsLatestVersion = true,
                        Latitude = 0,
                        Longitude = 0,
                        Language = "en",
                        Path = "/sitecore/content"
                    }),
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        Latitude = 0,
                        Longitude = 0,
                        IsLatestVersion = true,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 2);

            // Arrange
            var parentItem = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Country,
                Code = code,
                ItemId = id,
                TemplateId = Constants.TemplateIds.RegionPage,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);
            destinationsRepository.GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>()).Returns(hotelSearchResultItems);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().NotBeEmpty();
            actual.Count().Should().Be(2);
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldReturnHotels_WhenParentIsVirtualResort(Db db, string code, ID resortId1, ID resortId2)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            var virtualResortDbItem = new DbItem("VirtualResort", ID.NewID, Constants.TemplateIds.VirtualResort)
            {
                { Constants.Fields.VirtualDestination.Resorts, $"{resortId1}|{resortId2}" }
            };
            db.Add(virtualResortDbItem);

            var parentItem = new BaseDestinationsSearchResultItem()
            {
                Code = code,
                TemplateId = Constants.TemplateIds.VirtualResort,
                Uri = new ItemUri(virtualResortDbItem.ID, db.GetItem(virtualResortDbItem.ID).Database),
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(db.GetItem(virtualResortDbItem.ID));

            var hotelSearchResultItems = new SearchResults<HotelSearchResultItem>(
                new SearchHit<HotelSearchResultItem>[]
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        IsLatestVersion = true,
                        Latitude = 0,
                        Longitude = 0,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);

            destinationsRepository.GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>()).Returns(hotelSearchResultItems);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().NotBeEmpty();
            destinationsRepository.Received(1).GetHotelsCoordinatesByHotelsParentsPath(
                Arg.Is<ID[]>(ids => ids.Length == 2 && ids[0] == resortId1 && ids[1] == resortId2));
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldBeEmpty_WhenVirtualResortHasNoRelatedResorts(string code)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            var parentItem = new BaseDestinationsSearchResultItem()
            {
                Code = code,
                TemplateId = Constants.TemplateIds.VirtualResort,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns((Sitecore.Data.Items.Item)null);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().BeEmpty();
            destinationsRepository.DidNotReceive().GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>());
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldReturnHotels_WhenParentIsVirtualRegion(Db db, string code, ID regionId1, ID regionId2)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            var virtualRegionDbItem = new DbItem("VirtualRegion", ID.NewID, Constants.TemplateIds.VirtualRegion)
            {
                { Constants.Fields.VirtualDestination.Regions, $"{regionId1}|{regionId2}" }
            };
            db.Add(virtualRegionDbItem);

            var parentItem = new BaseDestinationsSearchResultItem()
            {
                Code = code,
                TemplateId = Constants.TemplateIds.VirtualRegion,
                Uri = new ItemUri(virtualRegionDbItem.ID, db.GetItem(virtualRegionDbItem.ID).Database),
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(db.GetItem(virtualRegionDbItem.ID));

            var hotelSearchResultItems = new SearchResults<HotelSearchResultItem>(
                new SearchHit<HotelSearchResultItem>[]
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        IsLatestVersion = true,
                        Latitude = 0,
                        Longitude = 0,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);

            destinationsRepository.GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>()).Returns(hotelSearchResultItems);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().NotBeEmpty();
            destinationsRepository.Received(1).GetHotelsCoordinatesByHotelsParentsPath(
                Arg.Is<ID[]>(ids => ids.Length == 2 && ids[0] == regionId1 && ids[1] == regionId2));
        }

        [Theory]
        [AutoData]
        public void GetHotelsCoordinatesByParentCode_ShouldBeEmpty_WhenVirtualRegionHasNoRelatedRegions(string code)
        {
            // Arrange
            IEnumerable<HotelCoordinates> hotelCoordinates = null;
            cache.GetItem<IEnumerable<HotelCoordinates>>(Arg.Any<string>()).Returns(hotelCoordinates);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<IEnumerable<HotelCoordinates>>()).Returns(hotelCoordinates);

            var parentItem = new BaseDestinationsSearchResultItem()
            {
                Code = code,
                TemplateId = Constants.TemplateIds.VirtualRegion,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(parentItem);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns((Sitecore.Data.Items.Item)null);

            // Act
            var actual = destinationsSearchService.GetHotelsCoordinatesByParentCode(code);

            // Assert
            actual.Should().BeEmpty();
            destinationsRepository.DidNotReceive().GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>());
        }

        [Theory]
        [AutoData]
        public void GetMuzement_ShouldBeNull_IfDestinationNotExists(string code)
        {
            // Arrange
            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(x => null);

            // Act
            var actual = destinationsSearchService.GetMuzement(code);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetMuzement_ShouldReturnMuzementData_IfResortHasNoMuzementIds(Db db, string code, float regionRadius)
        {
            // Arrange
            var regionDbItem = new DbItem("Region", ID.NewID, Constants.TemplateIds.RegionPage);
            regionDbItem.Fields.Add(Constants.Fields.Region.MuzementId, string.Empty);
            var resortDbItem = new DbItem("Resort", ID.NewID, Constants.TemplateIds.Resort);
            regionDbItem.Add(resortDbItem);
            db.Add(regionDbItem);

            var settingsFolderDbItem = new DbItem("Settings", ID.NewID, Templates.Settings.Id);
            var muzemetSettingsDbItem = new DbItem("Muzement Settings", ID.NewID, Constants.TemplateIds.MuzementSettings);
            muzemetSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.RegionRadius, regionRadius.ToString());
            settingsFolderDbItem.Add(muzemetSettingsDbItem);
            db.Add(settingsFolderDbItem);

            var resort = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Resort,
                Code = code,
                Uri = new ItemUri(resortDbItem.ID, db.GetItem(resortDbItem.ID).Database),
                TemplateId = Constants.TemplateIds.Resort,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(resort);

            var hotelSearchResultItems = new SearchResults<HotelSearchResultItem>(
                new SearchHit<HotelSearchResultItem>[]
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        TemplateId = Constants.TemplateIds.Accommodation,
                        SourceCodes = new[] { code },
                        Paths = new ID[] { ID.NewID },
                        IsLatestVersion = true,
                        Latitude = 1,
                        Longitude = 1,
                        Language = "en",
                        Path = "/sitecore/content"
                    })
                }, 1);

            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(db.GetItem(resortDbItem.ID));
            destinationsRepository.GetHotelsCoordinatesByHotelsParentsPath(Arg.Any<ID[]>()).Returns(hotelSearchResultItems);

            // Act
            var actual = destinationsSearchService.GetMuzement(code);

            // Assert
            actual.Should().NotBeNull();
            actual.Radius.Should().Be(regionRadius);
            actual.MuzementIds.Should().BeNull();
            actual.Coordinates.Should().HaveCount(1);
        }

        [Theory]
        [AutoData]
        public void GetMuzement_ShouldReturnMuzementData_IfRegionHasMuzementIds(Db db, string code, float regionRadius, IEnumerable<string> muzementIds)
        {
            // Arrange
            var regionDbItem = new DbItem("Region", ID.NewID, Constants.TemplateIds.RegionPage);
            regionDbItem.Fields.Add(Constants.Fields.Region.MuzementId, string.Join(",", muzementIds));
            db.Add(regionDbItem);

            var settingsFolderDbItem = new DbItem("Settings", ID.NewID, Templates.Settings.Id);
            var muzemetSettingsDbItem = new DbItem("Muzement Settings", ID.NewID, Constants.TemplateIds.MuzementSettings);
            muzemetSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.RegionRadius, regionRadius.ToString());
            settingsFolderDbItem.Add(muzemetSettingsDbItem);
            db.Add(settingsFolderDbItem);
            var regionItem = db.GetItem(regionDbItem.ID);
            var region = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Region,
                Code = code,
                Uri = regionItem.Uri,
                TemplateId = Constants.TemplateIds.RegionPage,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(region);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(regionItem);
            // Act
            var actual = destinationsSearchService.GetMuzement(code);

            // Assert
            actual.Should().NotBeNull();
            actual.Radius.Should().Be(regionRadius);
            actual.MuzementIds.Should().BeEquivalentTo(muzementIds);
        }

        [Theory]
        [AutoData]
        public void GetMuzement_ShouldReturnMuzementData_IfRegionHasMuzementIdsAndDestinationItemTemplateIsCountry(Db db, string code, float regionRadius, IEnumerable<string> muzementIds)
        {
            // Arrange
            var regionDbItem = new DbItem("Region", ID.NewID, Constants.TemplateIds.Country);
            regionDbItem.Fields.Add(Constants.Fields.Region.MuzementId, string.Join(",", muzementIds));
            db.Add(regionDbItem);

            var settingsFolderDbItem = new DbItem("Settings", ID.NewID, Templates.Settings.Id);
            var muzemetSettingsDbItem = new DbItem("Muzement Settings", ID.NewID, Constants.TemplateIds.MuzementSettings);
            muzemetSettingsDbItem.Fields.Add(Constants.Fields.MuzementSettings.CountryRadius, regionRadius.ToString());
            settingsFolderDbItem.Add(muzemetSettingsDbItem);
            db.Add(settingsFolderDbItem);

            var regionItem = db.GetItem(regionDbItem.ID);
            var region = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Region,
                Code = code,
                Uri = regionItem.Uri,
                TemplateId = Constants.TemplateIds.RegionPage,
            };

            destinationsRepository.GetDestinationItemByCode(Arg.Any<string>()).Returns(region);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(regionItem);
            // Act
            var actual = destinationsSearchService.GetMuzement(code);

            // Assert
            actual.Should().NotBeNull();
            actual.Radius.Should().Be(regionRadius);
        }

        [Theory]
        [AutoData]
        public void GetPromoPageDestinations_PromoPageDestinationsNotReceived_ReturnsNull(ID promoPageId)
        {
            // Arrange
            IEnumerable<ChildDestination> cacheResult = null;
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<List<ChildDestination>>>())
                .Returns(cacheResult);

            // Act
            var actual = destinationsSearchService.GetPromoPageDestinations(promoPageId);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetPromoPageDestinationsAsync_PromoPageDestinationsReceived_ReturnsCorrectResult(
            string code,
            string name,
            string templateName,
            string[] airportCodes,
            bool showOnSearchPod,
            List<Destination> parents,
            string[] relatedRegions,
            ID promoPageId)
        {
            // Arrange
            var serializedParents = parents.Select(JsonConvert.SerializeObject).ToArray();

            var destinationSearchResultItem = new DestinationSearchResultItem()
            {
                Code = code,
                ItemName = name,
                TemplateName = templateName,
                AirportCodes = airportCodes,
                ShowOnSearchPod = showOnSearchPod,
                Parents = serializedParents,
                RelatedRegions = relatedRegions
            };

            var childDestinations = new List<ChildDestination> { DestinationsMapper.MapFromDestinationSearchResultItem(code, destinationSearchResultItem) };
            cache.GetOrAdd(Arg.Any<string>(), Arg.Any<Func<List<ChildDestination>>>()).Returns(childDestinations);

            // Act
            var actual = destinationsSearchService.GetPromoPageDestinations(promoPageId);

            // Assert
            actual.Should().BeEquivalentTo(childDestinations);
        }

        [Fact]
        public void GetPromoPageDestinations_OnEmptyDatabase_ReturnsNull()
        {
            var promoPageId = ID.NewID;
            databaseProvider.GetItem(promoPageId).Returns((object)null);

            // Act
            using (new FakeSiteContextSwitcher(new SiteInfoPropertiesBuilder().ToSiteContext()))
            {
                var actual = destinationsSearchService.GetPromoPageDestinations(promoPageId);

                // Assert
                actual.Should().BeNull();
                destinationsLogger.Received(1).Error(Arg.Any<string>(), Arg.Any<object>());
            }
        }

        [Fact]
        public void GetPromoPageDestinations_OnEmptySetup_ReturnsNull()
        {
            var promoPageId = ID.NewID;
            var item = new FakeItem().ToSitecoreItem();
            databaseProvider.GetItem(promoPageId).Returns(item);

            using (new FakeSiteContextSwitcher(new SiteInfoPropertiesBuilder().ToSiteContext()))
            {
                // Act
                var actual = destinationsSearchService.GetPromoPageDestinations(promoPageId);

                // Assert
                actual.Should().BeNull();
                destinationsLogger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
            }
        }

        [Theory]
        [AutoData]
        public void GetPromoPageDestinations_GetResults_PromoPageIsNotConfigured(Db db, ID fieldId)
        {
            // Arrange
            var dbItem = new DbItem("Fake");
            dbItem.Fields.Add(new DbField(Constants.Fields.PromoPage.Destination, fieldId));

            var targetDbItem = new DbItem("Target item");
            targetDbItem.Fields.Add(new DbField(ID.NewID) { Value = Constants.Fields.PromoPage.Destination });

            db.Add(dbItem);
            db.Add(targetDbItem);

            var items = new[] { targetDbItem };
            var item = db.GetItem(dbItem.ID);

            var value = string.Join("|", items.Select(x => x.ID.Guid.ToString()));
            value = value + "| null | null";
            item.Editing.BeginEdit();
            MultilistField multilistField = new MultilistField(item.Fields[Constants.Fields.PromoPage.Destination]) { Value = value };
            item.Editing.EndEdit();

            var promoPageId = ID.NewID;
            databaseProvider.GetItem(promoPageId).Returns(item);

            var destination = new BaseDestinationsSearchResultItem()
            {
                TemplateName = Constants.TemplateNames.Resort,
                Code = "code",
                Children = null,
                Parents = null,
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>()
                {
                    new SearchHit<BaseDestinationsSearchResultItem>(1, destination)
                }, 1);

            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(results);

            // Act
            using (new FakeSiteContextSwitcher(new SiteInfoPropertiesBuilder().ToSiteContext()))
            {
                var actual = destinationsSearchService.GetPromoPageDestinations(promoPageId);

                // Assert
                actual.Should().NotBeNull();
                actual.Count().Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void GetImage_ShouldReturnImageUrl(string imageUrl, string code)
        {
            // Arrange
            var searchHit = new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()
            {
                ImageUrl = imageUrl
            });

            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>
            {
                searchHit
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>()).Returns(results);
            cache.GetItem<SearchHit<BaseDestinationsSearchResultItem>>(Arg.Any<string>()).Returns(searchHit);

            // Act
            var actual = destinationsSearchService.GetImage(code);

            // Assert
            actual.Should().BeEquivalentTo(imageUrl);
        }

        [Theory]
        [AutoData]
        public void GetHotelImage_ShouldReturnFirstImage(string code, string small, string medium, string large)
        {
            // Arrange
            ImageData nullImageData = null;
            cache.GetItem<ImageData>(Arg.Any<string>()).Returns(nullImageData);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<ImageData>(), Arg.Any<int>()).Returns(x => x[1]);

            var firstImage = new ImageData
            {
                Small = small,
                Medium = medium,
                Large = large
            };

            var secondImage = new ImageData
            {
                Small = "small-2",
                Medium = "medium-2",
                Large = "large-2"
            };

            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
                {
                    Images = JsonConvert.SerializeObject(new[] { firstImage, secondImage })
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelImage(code);

            // Assert
            actual.Should().NotBeNull();
            actual.Small.Should().Be(firstImage.Small);
            actual.Medium.Should().Be(firstImage.Medium);
            actual.Large.Should().Be(firstImage.Large);
        }

        [Theory]
        [AutoData]
        public void GetHotelImage_ShouldReturnNull_IfImagesAreMissingOrInvalid(string code)
        {
            // Arrange
            ImageData nullImageData = null;
            cache.GetItem<ImageData>(Arg.Any<string>()).Returns(nullImageData);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<ImageData>(), Arg.Any<int>()).Returns(x => x[1]);

            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem
                {
                    Images = "not-json"
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelImage(code);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByEntryInPolygonBorders_HotelCoordinates(string code, Point topLeftAngle, Point bottomRightAngle)
        {
            // Arrange
            var hints = new List<SearchHit<HotelSearchResultItem>>
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    TemplateId = Constants.TemplateIds.Accommodation,
                    SourceCodes = new[] { code },
                    Paths = new ID[] { ID.NewID },
                    IsLatestVersion = true,
                    Latitude = topLeftAngle.Latitude,
                    Longitude = topLeftAngle.Longitude,
                    Language = "en",
                    Path = "/sitecore/content"
                })
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);
            destinationsRepository.GetHotelsInsideCoordinateGrid(Arg.Any<Point>(), Arg.Any<Point>()).Returns(results);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("test-database")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = destinationsSearchService.GetHotelsByEntryInPolygonBorders(topLeftAngle, bottomRightAngle);

                // Assert
                actual.FirstOrDefault().Latitude.Should().Be(topLeftAngle.Latitude);
                actual.FirstOrDefault().Longitude.Should().Be(topLeftAngle.Longitude);
            }
        }

        [Theory]
        [AutoData]
        public void GetResorts_ShouldReturnData(string[] codes, string resortCode, string resortName)
        {
            // Arrange
            var searchHits = new List<SearchHit<HotelSearchResultItem>>();
            var resort = new DatasourceObject
            {
                ItemName = resortName,
                Name = resortName,
                Code = resortCode
            };

            foreach (var code in codes)
            {
                searchHits.Add(new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    TemplateId = Constants.TemplateIds.Accommodation,
                    SourceCodes = new[] { code },
                    Paths = new ID[] { ID.NewID },
                    IsLatestVersion = true,
                    Language = "en",
                    Path = "/sitecore/content",
                    Name = code,
                    ItemName = code,
                    HotelResort = JsonConvert.SerializeObject(resort)
                }));
            }

            var results = new SearchResults<HotelSearchResultItem>(searchHits, searchHits.Count);
            destinationsRepository.SearchHotelsByResortCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetResorts();

            // Assert
            actual.Count().Should().Be(1);
            actual.First().Hotels.Count.Should().Be(codes.Length);
            actual.First().ResortCode.Should().Be(resortCode);
            actual.First().ResortName.Should().Be(resortName);
            actual.First().Hotels.All(h => codes.Contains(h.HotelCode));
        }

        [Theory]
        [AutoData]
        public void GetResortsByCodes_ShouldReturnData(string[] codes, string resortCode, string resortName)
        {
            // Arrange
            var searchHits = new List<SearchHit<HotelSearchResultItem>>();
            var resort = new DatasourceObject
            {
                ItemName = resortName,
                Name = resortName,
                Code = resortCode
            };

            foreach (var code in codes)
            {
                searchHits.Add(new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    TemplateId = Constants.TemplateIds.Accommodation,
                    SourceCodes = new[] { code },
                    Paths = new ID[] { ID.NewID },
                    IsLatestVersion = true,
                    Language = "en",
                    Path = "/sitecore/content",
                    Name = code,
                    ItemName = code,
                    HotelResort = JsonConvert.SerializeObject(resort)
                }));
            }

            var results = new SearchResults<HotelSearchResultItem>(searchHits, searchHits.Count);
            destinationsRepository.SearchHotelsByResortCodes(codes).Returns(results);

            // Act
            var actual = destinationsSearchService.GetResortsByCodes(codes);

            // Assert
            actual.Count().Should().Be(1);
            actual.First().Hotels.Count.Should().Be(codes.Length);
            actual.First().ResortCode.Should().Be(resortCode);
            actual.First().ResortName.Should().Be(resortName);
            actual.First().Hotels.All(h => codes.Contains(h.HotelCode));
            destinationsLogger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetResortsByCodes_ShouldReturnCoordinates_WhenIncludeHotelCoordinatesIsTrue(string[] codes, string resortCode, string resortName)
        {
            // Arrange
            var searchHits = new List<SearchHit<HotelSearchResultItem>>();
            var resort = new DatasourceObject
            {
                ItemName = resortName,
                Name = resortName,
                Code = resortCode
            };
            const float latitude = 51.5f;
            const float longitude = -0.12f;

            foreach (var code in codes)
            {
                searchHits.Add(new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    TemplateId = Constants.TemplateIds.Accommodation,
                    SourceCodes = new[] { code },
                    Paths = new ID[] { ID.NewID },
                    IsLatestVersion = true,
                    Language = "en",
                    Path = "/sitecore/content",
                    Name = code,
                    ItemName = code,
                    Latitude = latitude,
                    Longitude = longitude,
                    HotelResort = JsonConvert.SerializeObject(resort)
                }));
            }

            var results = new SearchResults<HotelSearchResultItem>(searchHits, searchHits.Count);
            destinationsRepository.SearchHotelsByResortCodes(codes).Returns(results);

            // Act
            var actual = destinationsSearchService.GetResortsByCodes(codes, includeHotelCoordinates: true).ToList();

            // Assert
            actual.Should().HaveCount(1);
            actual.First().Hotels.Should().OnlyContain(h => h.Latitude == latitude && h.Longitude == longitude);
        }

        [Theory]
        [AutoData]
        public void GetResortsByCodes_ShouldNotReturnData(string[] codes, string resortCode, string resortName)
        {
            // Arrange
            var searchHits = new List<SearchHit<HotelSearchResultItem>>();
            var resort = new DatasourceObject
            {
                ItemName = resortName,
                Name = resortName,
                Code = resortCode
            };

            foreach (var code in codes)
            {
                searchHits.Add(new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                {
                    TemplateId = Constants.TemplateIds.Accommodation,
                    SourceCodes = new[] { code },
                    Paths = new ID[] { ID.NewID },
                    IsLatestVersion = true,
                    Language = "en",
                    Path = "/sitecore/content",
                    Name = code,
                    ItemName = code,
                    HotelResort = JsonConvert.SerializeObject(resort)
                }));
            }

            var results = new SearchResults<HotelSearchResultItem>(searchHits, searchHits.Count);
            destinationsRepository.SearchHotelsByResortCodes(codes).Returns(results);

            // Act
            var actual = destinationsSearchService.GetResortsByCodes(Array.Empty<string>());

            // Assert
            actual.Count().Should().Be(0);
            destinationsLogger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoDbData]
        public void GetHotelResortInfoByHotelCode_AccommodationResortInfo(AccommodationResortInfo accommodationResortInfo, string code)
        {
            // Arrange
            cache.GetItem<AccommodationResortInfo>(Arg.Any<string>()).Returns(accommodationResortInfo);

            // Act
            var actual = destinationsSearchService.GetHotelResortInfoByHotelCode(code);

            // Assert
            actual.ResortDescription.Should().Be(accommodationResortInfo.ResortDescription);
            actual.ResortImageUrl.Should().Be(accommodationResortInfo.ResortImageUrl);
        }

        [Theory]
        [AutoData]
        public void GetPromoFacilities_AccommodationResortInfo(PromoFacility promoFacility, string code)
        {
            // Arrange
            var result = new List<PromoFacility>
            {
                promoFacility
            };
            cache.GetItem<IEnumerable<PromoFacility>>(Arg.Any<string>()).Returns(result);

            // Act
            var actual = destinationsSearchService.GetPromoFacilities(code).FirstOrDefault();

            // Assert
            actual.Description.Should().Be(promoFacility.Description);
            actual.Image.Should().Be(promoFacility.Image);
            actual.Title.Should().Be(promoFacility.Title);
            actual.Link.Should().Be(promoFacility.Link);
        }

        [Fact]
        public void GetHotelsCodes_ShouldReturnExitingCodes_IfSolrReturnCodes()
        {
            // Arrange
            var hints = new List<SearchHit<SourcesSearchResultItem>>()
            {
                new SearchHit<SourcesSearchResultItem>(1, new SourcesSearchResultItem()
                {
                    SourceCodes = new[] { "code1" },
                }),
                new SearchHit<SourcesSearchResultItem>(1, new SourcesSearchResultItem()
                {
                    SourceCodes = new[] { "code2" },
                }),
                new SearchHit<SourcesSearchResultItem>(1, new SourcesSearchResultItem()
                {
                    SourceCodes = new[] { "code3" },
                }),
            };

            var codes = new[] { "code1", "code3", "code4" };

            var results = new SearchResults<SourcesSearchResultItem>(hints, 1);

            destinationsRepository.GetAllExistHotelsCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelsCodes(codes);

            // Assert
            actual.Length.Should().Be(2);
            actual.Should().Contain("code1");
            actual.Should().Contain("code3");
        }

        [Fact]
        public void GetDestinationsByCodes_ShouldNotBeEmpty_IfRepositoryHasResultt()
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()
                {
                    SourceCodes = new[] { "code1" },
                }),
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()
                {
                    SourceCodes = new[] { "code2" },
                }),
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()
                {
                    SourceCodes = new[] { "code3" },
                }),
            };

            var codes = new[] { "code1", "code3", "code4" };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationsByCodes(codes);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Fact]
        public void GetDestinationsByCodes_ShouldPassIncludeRelatedItemsFlagToRepository()
        {
            // Arrange
            var codes = new[] { "code1" };
            var results = new SearchResults<BaseDestinationsSearchResultItem>(
                new List<SearchHit<BaseDestinationsSearchResultItem>>(),
                0);
            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(results);

            // Act
            destinationsSearchService.GetDestinationsByCodes(codes, includeRelatedItems: false).ToArray();

            // Assert
            destinationsRepository.Received(1)
                .SearchByCodes(
                    Arg.Is<List<string>>(x => x.SequenceEqual(codes)),
                    false,
                    false);
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByCodes_ShouldBeEmpty_IfRepositoryHasNoResult(string[] codes)
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>();

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 0);

            destinationsRepository.SearchByCodes(Arg.Any<List<string>>(), Arg.Any<bool>(), Arg.Any<bool>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationsByCodes(codes);

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetHotelsByGiataCodes_ShouldNotBeEmpty_IfRepositoryHasResult()
        {
            // Arrange
            var hints = new List<SearchHit<BaseHotelSearchResultItem>>()
            {
                new SearchHit<BaseHotelSearchResultItem>(1, new BaseHotelSearchResultItem()
                {
                    SourceCodes = new[] { "code1" },
                }),
                new SearchHit<BaseHotelSearchResultItem>(1, new BaseHotelSearchResultItem()
                {
                    SourceCodes = new[] { "code2" },
                }),
                new SearchHit<BaseHotelSearchResultItem>(1, new BaseHotelSearchResultItem()
                {
                    SourceCodes = new[] { "code3" },
                }),
            };

            var codes = new[] { "code1", "code3", "code4" };

            var results = new SearchResults<BaseHotelSearchResultItem>(hints, 3);

            destinationsRepository.GetHotelsByGiataCodes(Arg.Any<List<string>>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelsByGiataCodes(codes);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByGiataCodes_ShouldBeEmpty_IfRepositoryHasNoResult(string[] codes)
        {
            // Arrange
            var hints = new List<SearchHit<BaseHotelSearchResultItem>>();

            var results = new SearchResults<BaseHotelSearchResultItem>(hints, 0);

            destinationsRepository.GetHotelsByGiataCodes(Arg.Any<List<string>>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelsByGiataCodes(codes);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByNames_ShouldNotBeEmpty_IfRepositoryHasResult(string[] names)
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()),
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()),
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem()),
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 3);

            destinationsRepository.SearchByNames(Arg.Any<List<string>>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationsByNames(names, DestinationFilter.All);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetDestinationsByNames_ShouldBeEmpty_IfRepositoryHasNoResult(string[] names)
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>();

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 0);

            destinationsRepository.SearchByNames(Arg.Any<List<string>>(), Arg.Any<DestinationFilter>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationsByNames(names, DestinationFilter.All);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByAtcomCodes_ShouldNotBeEmpty_IfRepositoryHasResult(string[] codes)
        {
            // Arrange
            var hints = new List<SearchHit<HotelSearchResultItem>>()
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()),
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()),
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()),
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 3);

            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelsByAtcomCodes(codes);

            // Assert
            actual.Should().NotBeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetHotelsByAtcomCodes_ShouldBeEmpty_IfRepositoryHasNoResult(string[] codes)
        {
            // Arrange
            var hints = new List<SearchHit<HotelSearchResultItem>>();

            var results = new SearchResults<HotelSearchResultItem>(hints, 0);

            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetHotelsByAtcomCodes(codes);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetDestinationInfo_ShouldBeNull_IfRepositoryHasNoResult(string code)
        {
            // Arrange
            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>();

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 0);

            destinationsRepository.SearchByCodes(Arg.Any<List<string>>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationInfo(code);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void GetDestinationInfo_ShouldBeNotBeNull_IfRepositoryHasResult(string code, string name)
        {
            // Arrange
            DestinationInfo nullObject = null;
            cache.GetItem<DestinationInfo>(Arg.Any<string>()).Returns(nullObject);
            cache.StoreItem(Arg.Any<string>(), Arg.Any<DestinationInfo>(), Arg.Any<int>()).Returns(x => x[1]);

            var item = new FakeItem()
                .WithField(Constants.Fields.DatasourceItem.Code, code)
                .WithField(Constants.Fields.DatasourceItem.Name, name)
                .WithTemplate(ID.NewID);

            var document = Substitute.For<BaseDestinationsSearchResultItem>();
            document.GetItem().Returns(item.ToSitecoreItem());

            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, document)
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            destinationsRepository.SearchByCodes(Arg.Any<List<string>>()).Returns(results);

            // Act
            var actual = destinationsSearchService.GetDestinationInfo(code);

            // Assert
            actual.Should().NotBeNull();
            actual.Code.Should().Be(code);
            actual.Name.Should().Be(name);
        }

        [Theory]
        [AutoData]
        public void SearchByName_ShouldBeEmpty_WhenRepositoryHasNoResult(string query)
        {
            // Arrange
            List<string> suggestions = new List<string>();
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(suggestions);

            SearchResults<BaseDestinationsSearchResultItem> results = null;

            destinationsRepository
                .SearchByName(query, Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchService.SearchByName(query, true, true, DestinationFilter.All, false);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SearchByName_ShouldBeEmpty_WhenTotalNumberOfResultsIsZero(string query)
        {
            // Arrange
            List<string> suggestions = new List<string>();
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(suggestions);

            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem())
            };

            SearchResults<BaseDestinationsSearchResultItem> results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 0);

            destinationsRepository
                .SearchByName(Arg.Any<string>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchService.SearchByName(query, true, true, DestinationFilter.All, false);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SearchByName_ShouldSearchBySuggestedQuery_WhenQueryReturnNoResults(List<string> suggestions, string query)
        {
            // Arrange
            SearchResults<BaseDestinationsSearchResultItem> searchResults = null;
            destinationsRepository.SearchByName(query, Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(searchResults);

            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(suggestions);
            var suggestion = suggestions.First();

            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem())
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            destinationsRepository
                .SearchByName(suggestion, Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchService.SearchByName(query, true, true, DestinationFilter.All, false);

            // Assert
            actual.Should().NotBeNull();
            destinationsRepository.Received().SearchByName(suggestion, true, true, DestinationFilter.All, false);
        }

        [Theory]
        [AutoData]
        public void SearchByName_ShouldSearchBySuggestedQuery_WhenSpellCheckHasSuggestions(string query)
        {
            // Arrange
            SearchResults<BaseDestinationsSearchResultItem> searchResults = null;
            destinationsRepository.SearchByName(query, Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(searchResults);

            List<string> suggestions = new List<string>();
            destinationsRepository.SpellCheck(Arg.Any<string>(), 1).Returns(suggestions);

            var hints = new List<SearchHit<BaseDestinationsSearchResultItem>>()
            {
                new SearchHit<BaseDestinationsSearchResultItem>(1, new BaseDestinationsSearchResultItem())
            };

            var results = new SearchResults<BaseDestinationsSearchResultItem>(hints, 1);

            destinationsRepository
                .SearchByName(query, Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<DestinationFilter>(), Arg.Any<bool>())
                .Returns(results);

            // Act
            var actual = destinationsSearchService.SearchByName(query, true, true, DestinationFilter.All, false);

            // Assert
            actual.Should().NotBeNull();
            destinationsRepository.Received().SearchByName(query, true, true, DestinationFilter.All, false);
        }

        [Theory]
        [AutoData]
        public void GetHotelHighlightsByHotelCode_Returns_HotelHighlights(HotelHighlights hotelHighlight, string code)
        {
            // Arrange
            var result = new List<HotelHighlights>
            {
                hotelHighlight
            };
            cache.GetItem<IEnumerable<HotelHighlights>>(Arg.Any<string>()).Returns(result);

            // Act
            var actual = destinationsSearchService.GetHotelHighlightsByHotelCode(code).FirstOrDefault();

            // Assert
            actual.Should().NotBeNull();
            actual.Description.Should().Be(hotelHighlight.Description);
            actual.Image.Should().Be(hotelHighlight.Image);
            actual.Title.Should().Be(hotelHighlight.Title);
            actual.Subtitle.Should().Be(hotelHighlight.Subtitle);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void GetHotelByGiataCode_ThrowsArgumentException_ForNullOrWhitespace(string giata)
        {
            // Act / Assert
            Assert.Throws<ArgumentException>(() => destinationsSearchService.GetExpediaHotelByGiataCode(giata));
        }

        [Fact]
        public void GetHotelByGiataCode_ReturnsNull_WhenRepositoryReturnsNoHits()
        {
            // Arrange
            destinationsRepository
                .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G1"))
                .Returns((SearchResults<HotelSearchResultItem>)null);

            // Act
            var result = destinationsSearchService.GetExpediaHotelByGiataCode("G1");

            // Assert
            result.Should().BeNull();
            destinationsLogger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetHotelByGiataCode_ReturnsNull_WhenDocumentIsNull()
        {
            // Arrange
            var hits = new List<SearchHit<HotelSearchResultItem>>
    {
        new SearchHit<HotelSearchResultItem>(1, (HotelSearchResultItem)null)
    };

            var searchResults = new SearchResults<HotelSearchResultItem>(hits, hits.Count);

            destinationsRepository
                .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G2"))
                .Returns(searchResults);

            // Act
            var result = destinationsSearchService.GetExpediaHotelByGiataCode("G2");

            // Assert
            result.Should().BeNull();
            destinationsLogger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetHotelByGiataCode_ReturnsNull_WhenSitecoreItemCannotBeResolved()
        {
            // Arrange
            var doc = new HotelSearchResultItem
            {
                ItemId = ID.NewID,
                GiataCode = "GIATA123",
                ItemName = "ItemName",
                Name = "Hotel Name",
                Description = "Desc",
                Latitude = 1.23f,
                Longitude = 4.56f,
                SourceCodes = new[] { "W123456" },
                Images = JsonConvert.SerializeObject(new[] { new { Url = "img1" } })
            };

            destinationsRepository
                .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G3"))
                .Returns(CreateHotelSearchResults(doc));

            // Act
            var response = destinationsSearchService.GetExpediaHotelByGiataCode("G3");

            // Assert
            response.Should().BeNull();

            destinationsLogger.Received(1).Warn(
                Arg.Is<string>(x => x.Contains("Sitecore item could not be resolved")),
                Arg.Any<object>());
        }

        [Fact]
        public void GetHotelByGiataCode_ReturnsResponse_WhenSitecoreItemIsResolved()
        {
            // Arrange
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, "W123456" }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var doc = new HotelSearchResultItem
                {
                    ItemId = hotelItem.ID,
                    Uri = hotelItem.Uri,
                    GiataCode = "GIATA123",
                    ItemName = "ItemName",
                    Name = "Hotel Name",
                    Description = "Desc",
                    Latitude = 1.23f,
                    Longitude = 4.56f,
                    SourceCodes = new[] { "W123456" },
                    Images = JsonConvert.SerializeObject(new[] { new { Url = "img1" } })
                };

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G3"))
                    .Returns(CreateHotelSearchResults(doc));

                // Act
                var response = destinationsSearchService.GetExpediaHotelByGiataCode("G3");

                // Assert
                response.Should().NotBeNull();
                response.SitecoreId.Should().Be(hotelItem.ID.ToString());
                response.HotelType.Should().Be(HotelSourceType.Expedia.ToString());
                response.Facilities.Should().BeEmpty();
                response.RoomTypes.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetHotelByGiataCode_PopulatesFacilities_FromSitecoreItem()
        {
            // Arrange
            var facilityTypeId = ID.NewID;

            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Facilities", ID.NewID, Constants.TemplateIds.AccommodationFacilitiesFolder)
            {
                new DbItem("Wi-fi", ID.NewID, Constants.TemplateIds.AccommodationFacility)
                {
                    { Constants.Fields.BaseFacilityItem.FacilityType, facilityTypeId.ToString() },
                    { Constants.Fields.AccommodationFacilityItem.TextValue, "Free Wi-fi" }
                }
            },
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, "W123456" }
            }
        },
        new DbItem("Wi-fi Type", facilityTypeId, Constants.TemplateIds.FacilityType)
        {
            { Constants.Fields.DatasourceItem.Code, "550" },
            { Constants.Fields.DatasourceItem.Name, "Wi-fi" }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var indexedFacilities = new[]
                {
            new AccommodationFacilityVirtualGroup
            {
                Code = "INDEX",
                Name = "Indexed facilities",
                Title = "Indexed facilities",
                Items = new[]
                {
                    new HotelFacility
                    {
                        Name = "Indexed facility",
                        FacilityCode = "999"
                    }
                }
            }
                };

                var doc = new HotelSearchResultItem
                {
                    ItemId = hotelItem.ID,
                    Uri = hotelItem.Uri,
                    GiataCode = "GIATA789",
                    ItemName = "ItemName",
                    Name = "Hotel Name",
                    Description = "Desc",
                    SourceCodes = new[] { "W123456" },
                    Facilities = JsonConvert.SerializeObject(indexedFacilities)
                };

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G5"))
                    .Returns(CreateHotelSearchResults(doc));

                // Act
                var response = destinationsSearchService.GetExpediaHotelByGiataCode("G5");

                // Assert
                response.Should().NotBeNull();
                response.Facilities.Should().NotBeNull();
                response.Facilities.Should().HaveCount(1);

                var facilityGroup = response.Facilities.First();
                facilityGroup.Code.Should().BeNull();
                facilityGroup.Name.Should().BeNull();
                facilityGroup.Title.Should().BeNull();

                facilityGroup.Items.Should().HaveCount(1);

                var facility = facilityGroup.Items.First();
                facility.Name.Should().Be("Wi-fi");
                facility.FacilityCode.Should().Be("550");
                facility.TextValue.Should().Be("Free Wi-fi");
            }
        }

        [Fact]
        public void GetHotelByGiataCode_PopulatesRoomTypes_FromSitecoreExpediaRoomsFolder()
        {
            // Arrange
            using (var db = new Db
    {
        new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
        {
            new DbItem("Rooms - Expedia", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder)
            {
                { Constants.Fields.DatasourceItem.Code, "W123456" },
                new DbItem("Room 1", ID.NewID, Constants.TemplateIds.AccommodationRoom)
                {
                    { Constants.Fields.DatasourceItem.Code, "R1" },
                    { Constants.Fields.DatasourceItem.Name, "Room 1" },
                    { Constants.Fields.AccommodationReferenceItem.Content, string.Empty },
                    { Constants.Fields.AccommodationReferenceItem.Description, "Room description" }
                }
            }
        }
    })
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var indexedRoom = new HotelRoom
                {
                    Code = "INDEX-R1",
                    Name = "Indexed Room"
                };

                var roomsBySource = new Dictionary<string, HotelRoom[]>
        {
            { "W123456", new[] { indexedRoom } }
        };

                var doc = new HotelSearchResultItem
                {
                    ItemId = hotelItem.ID,
                    Uri = hotelItem.Uri,
                    GiataCode = "GIATA456",
                    ItemName = "ItemName2",
                    Name = "Hotel Name2",
                    Description = "Desc2",
                    Latitude = 2.34f,
                    Longitude = 5.67f,
                    SourceCodes = new[] { "W123456" },
                    Rooms = JsonConvert.SerializeObject(roomsBySource)
                };

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == "G4"))
                    .Returns(CreateHotelSearchResults(doc));

                // Act
                var response = destinationsSearchService.GetExpediaHotelByGiataCode("G4");

                // Assert
                response.Should().NotBeNull();
                response.RoomTypes.Should().NotBeNull();
                response.RoomTypes.Should().HaveCount(1);
                response.RoomTypes[0].Code.Should().Be("R1");
                response.RoomTypes[0].Name.Should().Be("Room 1");
            }
        }

        private static SearchResults<HotelSearchResultItem> CreateHotelSearchResults(HotelSearchResultItem document)
        {
            return new SearchResults<HotelSearchResultItem>(
                new List<SearchHit<HotelSearchResultItem>>
                {
            new SearchHit<HotelSearchResultItem>(1, document)
                },
                1);
        }
    }
}
