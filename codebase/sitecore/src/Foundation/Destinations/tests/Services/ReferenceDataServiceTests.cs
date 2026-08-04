using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Sitecore.NSubstituteUtils;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class ReferenceDataServiceTests
    {
        private readonly IUserCountryRepository userCountryRepository;
        private readonly IDialingCodeRepository dialingCodeRepository;
        private readonly IBoardTypesRepository boardTypesRepository;
        private readonly IRoomTypesRepository roomTypesRepository;
        private readonly IHtmlCacheRepository cache;
        private readonly IReferenceDataService referenceDataService;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IFilterPillsRepository recommendedFiltersRepository;

        public ReferenceDataServiceTests()
        {
            userCountryRepository = Substitute.For<IUserCountryRepository>();
            dialingCodeRepository = Substitute.For<IDialingCodeRepository>();
            boardTypesRepository = Substitute.For<IBoardTypesRepository>();
            roomTypesRepository = Substitute.For<IRoomTypesRepository>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            recommendedFiltersRepository = Substitute.For<IFilterPillsRepository>();
            cache = new HtmlCacheRepository();
            referenceDataService = new ReferenceDataService(userCountryRepository, dialingCodeRepository, boardTypesRepository, roomTypesRepository, destinationsRepository, recommendedFiltersRepository, cache);
        }

        [Theory]
        [AutoData]
        public void GetAllCountries_ShouldReturnAllCountries_IfCountriesExists(UserCountry userCountry)
        {
            // Arrange
            const string trackingId = "user-country-tracking";
            var countryItem = new FakeItem()
                .WithName(trackingId)
                .WithField(Constants.Fields.UserCountry.CountryName, userCountry.Name)
                .WithField(Constants.Fields.UserCountry.CountryCode, userCountry.Code)
                .WithField(Constants.Fields.UserCountry.Iso2, userCountry.Iso2)
                .ToSitecoreItem();

            userCountryRepository.GetAllUserCountryItems().Returns(new List<Item> { countryItem });

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("fake")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetAllCountries().FirstOrDefault();

                // Assert
                actual.Name.Should().Be(userCountry.Name);
                actual.Code.Should().Be(userCountry.Code);
                actual.Iso2.Should().Be(userCountry.Iso2);
                actual.TrackingId.Should().Be(trackingId);
            }
        }

        [Theory]
        [AutoData]
        public void GetAllDialingCodes_ShouldReturnDialingCodes_IfDialingCodesExists(DialingCode dialingCode)
        {
            // Arrange
            var dialingCodesItem = new FakeItem()
                .WithField(Constants.Fields.DialingCode.AreaName, dialingCode.Name)
                .WithField(Constants.Fields.DialingCode.AreaCode, dialingCode.Code.ToString("R"))
                .ToSitecoreItem();

            dialingCodeRepository.GetAllDialingCodeItems().Returns(new List<Item> { dialingCodesItem });

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetAllDialingCodes().FirstOrDefault();

                // Assert
                actual.Name.Should().Be(dialingCode.Name);
                actual.Code.Should().Be(dialingCode.Code);
            }
        }

        [Fact]
        public void GetAllDialingCodes_ShouldReturnEmptyList_IfDataIsNull()
        {
            // Arrange
            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetAllDialingCodes();

                // Assert
                actual.Should().BeEmpty();
            }
        }

        [Theory]
        [AutoData]
        public void GetAllBoardTypes_ShouldReturnBoardType_IfBoardTypeItemExist(Db db, BoardType boardType)
        {
            // Arrange
            var boardGroupItemDbTemplate = new DbTemplate(boardType.BoardGroup.Type);
            boardGroupItemDbTemplate.Add(Constants.Fields.DatasourceItem.Code);
            boardGroupItemDbTemplate.Add(Constants.Fields.DatasourceItem.Name);
            db.Add(boardGroupItemDbTemplate);

            var boardGroupDbItem = new DbItem("BoardGroup");
            boardGroupDbItem.TemplateID = db.GetItem(boardGroupItemDbTemplate.ID).ID;

            AddCommonFieldValuesToItem(boardGroupDbItem, boardType.BoardGroup.Code, boardType.BoardGroup.Name, boardType.BoardGroup.ItemName);

            db.Add(boardGroupDbItem);

            var boardTypeDbItem = new DbItem("BoardType")
            {
                new DbField(Constants.Fields.DatasourceItem.Content)
                {
                    Value = boardType.Content
                },
                new DbField(Constants.Fields.DatasourceItem.Description)
                {
                    Value = boardType.Description
                },
                new DbField(Constants.Fields.BoardTypeItem.BoardGroup)
                {
                    Type = "Droplink",
                    Value = boardGroupDbItem.ID.ToString()
                }
            };

            AddCommonFieldValuesToItem(boardTypeDbItem, boardType.Code, boardType.Name, boardType.ItemName);
            db.Add(boardTypeDbItem);

            boardTypesRepository.GetAllBoardTypeItems().Returns(new List<Item> { db.GetItem(boardTypeDbItem.ID) });

            var fakeSiteContext = new FakeSiteContext(
                new Sitecore.Collections.StringDictionary
                {
                    { "name", "fake" }
                });

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var actual = referenceDataService.GetAllBoardTypes().FirstOrDefault();

                // Assert
                actual.Code.Should().Be(boardType.Code);
                actual.Name.Should().Be(boardType.Name);
                actual.ItemName.Should().Be(boardType.ItemName);
                actual.TrackingId.Should().Be(boardType.Name);
                actual.Content.Should().Be(boardType.Content);
                actual.Description.Should().Be(boardType.Description);
                actual.BoardGroup.Code.Should().Be(boardType.BoardGroup.Code);
                actual.BoardGroup.Name.Should().Be(boardType.BoardGroup.Name);
                actual.BoardGroup.Type.Should().Be(boardType.BoardGroup.Type);
            }
        }

        [Theory]
        [AutoData]
        public void GetAllRoomTypes_ShouldReturnRoomTypes_IfRoomTypesExists(RoomType roomType)
        {
            // Arrange
            var hints = new List<SearchHit<RoomTypeSearchResultItem>>
            {
                new SearchHit<RoomTypeSearchResultItem>(1, new RoomTypeSearchResultItem()
                {
                    Code = roomType.Code,
                    Title = roomType.Name,
                    Name = roomType.ItemName,
                    Content = roomType.Content,
                    Description = roomType.Description
                })
            };
            var results = new SearchResults<RoomTypeSearchResultItem>(hints, 1);

            roomTypesRepository.GetAll().Returns(results);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetAllRoomTypes().FirstOrDefault();

                // Assert
                actual.Code.Should().Be(roomType.Code);
                actual.Description.Should().Be(roomType.Description);
                actual.TrackingId.Should().Be(roomType.ItemName);
            }
        }

        [Theory]
        [AutoData]
        public void GetRoomTypes_ShouldReturnRoomTypes_IfRoomTypesExists(RoomType roomType, int page, int take)
        {
            // Arrange
            var hints = new List<SearchHit<RoomTypeSearchResultItem>>
            {
                new SearchHit<RoomTypeSearchResultItem>(1, new RoomTypeSearchResultItem()
                {
                    Code = roomType.Code,
                    Title = roomType.Name,
                    Name = roomType.ItemName,
                    Content = roomType.Content,
                    Description = roomType.Description
                })
            };
            var results = new SearchResults<RoomTypeSearchResultItem>(hints, 1);

            roomTypesRepository.Get(Arg.Any<int>(), Arg.Any<int>()).Returns(results);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetRoomTypes(page, take);
                var room = actual.Rooms.FirstOrDefault();

                // Assert
                room.Code.Should().Be(roomType.Code);
                room.Description.Should().Be(roomType.Description);
                room.TrackingId.Should().Be(roomType.ItemName);
                actual.TotalSearchResults.Should().Be(1);
            }
        }

        [Theory]
        [AutoData]
        public void GetHotelCodes_ShouldReturnHotelCodes(RoomType roomType)
        {
            // Arrange
            var hints = new List<SearchHit<SourcesSearchResultItem>>
            {
                new SearchHit<SourcesSearchResultItem>(1, new SourcesSearchResultItem()
                {
                    SourceCodes = new[] { roomType.Code }
                })
            };
            var results = new SearchResults<SourcesSearchResultItem>(hints, 1);

            destinationsRepository.GetAllExistHotelsCodes().Returns(results);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName")
                .WithHostName("test-site-host")
                .WithDatabase("master")
                .WithStartItem("/test/start/items");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var actual = referenceDataService.GetHotelCodes();

                // Assert
                actual.FirstOrDefault().Should().Be(roomType.Code);
            }
        }

        [Theory]
        [AutoData]
        public async Task GetAccomodationToGiataMapping_ShouldReturnHotelCodes(List<string> accomodationCodes)
        {
            // Arrange
            var codeThatWouldBeFound1 = accomodationCodes[0];
            var codeThatWouldBeFound2 = accomodationCodes[1];
            var expectedCode = Guid.NewGuid().ToString();
            var hits = new SearchResults<HotelSearchResultItem>(
                new[]
            {
                new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem { Code = expectedCode, SourceCodes = new[] { codeThatWouldBeFound1, codeThatWouldBeFound2 } })
            }, 1);

            destinationsRepository
                .GetGiataToAccommodationCodesMapping(Arg.Is<List<string>>(x => x.Contains(codeThatWouldBeFound1) || x.Contains(codeThatWouldBeFound2)))
                .Returns(hits);

            // Act
            var result = await referenceDataService.GetAccommodationToGiataMapping(accomodationCodes);

            // Assert
            result[codeThatWouldBeFound1].Should().Be(expectedCode);
            result[codeThatWouldBeFound2].Should().Be(expectedCode);
        }

        [Fact]
        public void GetFilterPillsConfig_ReturnsConfigWithOptionsFromRepository()
        {
            // Arrange
            var recommendedFiltersItem = new FakeItem()
                .WithField(Constants.Fields.RecommendedFilters.MinNumberOfOffers, "5")
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "boardType")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "AI")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "All Inclusive"))
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "starRating")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "5")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "5 Star"));

            var filterPillsItem = new FakeItem()
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "tripAdvisor")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "4")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "Excellent"));

            recommendedFiltersRepository.GetRecommendedFiltersItem().Returns(recommendedFiltersItem);
            recommendedFiltersRepository.GetFilterPillsItem().Returns(filterPillsItem);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var result = referenceDataService.GetFilterPillsConfig();

                // Assert
                result.Should().NotBeNull();
                result.RecommendedFilterConfig.MinNumberOfOffers.Should().Be(5);
                result.RecommendedFilterConfig.Options.Should().HaveCount(2);
                result.Options.Should().HaveCount(1);
                result.Options.First().FilterCode.Should().Be("tripAdvisor");
                result.Options.First().Code.Should().Be("4");
            }
        }

        [Fact]
        public void GetFilterPillsConfig_NullItems_ReturnsEmptyConfig()
        {
            // Arrange
            recommendedFiltersRepository.GetRecommendedFiltersItem().Returns((Item)null);
            recommendedFiltersRepository.GetFilterPillsItem().Returns((Item)null);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var result = referenceDataService.GetFilterPillsConfig();

                // Assert
                result.Should().NotBeNull();
                result.Options.Should().BeEmpty();
                result.RecommendedFilterConfig.Should().NotBeNull();
                result.RecommendedFilterConfig.MinNumberOfOffers.Should().Be(0);
                result.RecommendedFilterConfig.Options.Should().BeEmpty();
            }
        }

        [Fact]
        public void GetFilterPillsConfig_FilterPillsItemIsNull_ReturnsRecommendedConfigAndEmptyOptions()
        {
            // Arrange
            var recommendedFiltersItem = new FakeItem()
                .WithField(Constants.Fields.RecommendedFilters.MinNumberOfOffers, "4")
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "boardType")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "AI")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "All Inclusive"));

            recommendedFiltersRepository.GetRecommendedFiltersItem().Returns(recommendedFiltersItem);
            recommendedFiltersRepository.GetFilterPillsItem().Returns((Item)null);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var result = referenceDataService.GetFilterPillsConfig();

                // Assert
                result.Options.Should().BeEmpty();
                result.RecommendedFilterConfig.MinNumberOfOffers.Should().Be(4);
                result.RecommendedFilterConfig.Options.Should().HaveCount(1);
            }
        }

        [Fact]
        public void GetFilterPillsConfig_RecommendedItemIsNull_ReturnsDefaultRecommendedConfigAndFilterPillOptions()
        {
            // Arrange
            var filterPillsItem = new FakeItem()
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "tripAdvisor")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "5")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "Exceptional"));

            recommendedFiltersRepository.GetRecommendedFiltersItem().Returns((Item)null);
            recommendedFiltersRepository.GetFilterPillsItem().Returns(filterPillsItem);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var result = referenceDataService.GetFilterPillsConfig();

                // Assert
                result.RecommendedFilterConfig.MinNumberOfOffers.Should().Be(0);
                result.RecommendedFilterConfig.Options.Should().BeEmpty();
                result.Options.Should().HaveCount(1);
                result.Options.First().Code.Should().Be("5");
            }
        }

        [Fact]
        public void GetFilterPillsConfig_WithTypeField_ConcatenatesTypeAndCode()
        {
            // Arrange
            var recommendedFiltersItem = new FakeItem()
                .WithField(Constants.Fields.RecommendedFilters.MinNumberOfOffers, "3")
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "timeSlots")
                    .WithField(Constants.Fields.RecommendedFilterOption.Type, "Morning")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "06:00-12:00")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "Morning Flights"));

            var filterPillsItem = new FakeItem()
                .WithChild(new FakeItem()
                    .WithItemVersions(GetItemVersions())
                    .WithField(Constants.Fields.RecommendedFilterOption.FilterCode, "timeSlots")
                    .WithField(Constants.Fields.RecommendedFilterOption.Type, "Evening")
                    .WithField(Constants.Fields.RecommendedFilterOption.Code, "18:00-22:00")
                    .WithField(Constants.Fields.RecommendedFilterOption.Name, "Evening Flights"));

            recommendedFiltersRepository.GetRecommendedFiltersItem().Returns(recommendedFiltersItem);
            recommendedFiltersRepository.GetFilterPillsItem().Returns(filterPillsItem);

            SiteContext siteContext = new SiteInfoPropertiesBuilder("TestSiteName");

            using (new FakeSiteContextSwitcher(siteContext))
            {
                // Act
                var result = referenceDataService.GetFilterPillsConfig();

                // Assert
                result.RecommendedFilterConfig.Options.First().Code.Should().Be("Morning|06:00-12:00");
                result.Options.First().Code.Should().Be("Evening|18:00-22:00");
            }
        }

        private void AddCommonFieldValuesToItem(DbItem item, string code, string name, string itemName)
        {
            item.Add(Constants.Fields.DatasourceItem.Code, code);
            item.Add(Constants.Fields.DatasourceItem.Name, name);
            item.Name = itemName;
        }

        private ItemVersions GetItemVersions()
        {
            var itemVersions = Substitute.For<ItemVersions>(new FakeItem().ToSitecoreItem());
            itemVersions.Count.Returns(1);
            return itemVersions;
        }
    }
}