using System;
using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class ExpediaHotelContentResolverServiceTests
    {
        private readonly IDestinationsRepository destinationsRepository;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;
        private readonly ExpediaHotelContentResolverService service;

        public ExpediaHotelContentResolverServiceTests()
        {
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            searchDatasourceRepository = Substitute.For<ISearchDatasourceRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            logger = Substitute.For<IDestinationsLogger>();

            service = new ExpediaHotelContentResolverService(
                destinationsRepository,
                searchDatasourceRepository,
                databaseProvider,
                logger);
        }

        [Fact]
        public void ResolveHotelItem_ShouldThrowArgumentNullException_WhenRequestIsNull()
        {
            Action act = () => service.ResolveHotelItem(null);

            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void ResolveHotelItem_ShouldReturnMasterItem_WhenSitecoreIdExists()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    SitecoreId = hotelItem.ID.ToString(),
                    GiataCode = "36363636"
                };

                databaseProvider
                    .GetItem(hotelItem.ID, DatabaseType.Master)
                    .Returns(hotelItem);

                var result = service.ResolveHotelItem(request);

                result.Should().Be(hotelItem);

                databaseProvider.Received(1)
                    .GetItem(hotelItem.ID, DatabaseType.Master);

                destinationsRepository.DidNotReceiveWithAnyArgs()
                    .SearchHotelsByCodes(default(string[]));
            }
        }

        [Fact]
        public void ResolveHotelItem_ShouldFallbackToGiata_WhenSitecoreIdIsInvalid()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    SitecoreId = "not-valid-sitecore-id",
                    GiataCode = "36363636"
                };

                var searchResults = CreateHotelSearchResults(hotelItem, request.GiataCode);

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == request.GiataCode))
                    .Returns(searchResults);

                databaseProvider
                    .GetItem(hotelItem.ID, DatabaseType.Master)
                    .Returns(hotelItem);

                var result = service.ResolveHotelItem(request);

                result.Should().Be(hotelItem);

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("SitecoreId") && x.Contains("Falling back to GIATA")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ResolveHotelItem_ShouldReturnNull_WhenGiataCodeIsEmpty()
        {
            var request = new UpsertHotelRequest
            {
                GiataCode = null
            };

            var result = service.ResolveHotelItem(request);

            result.Should().BeNull();

            logger.Received(1).Warn(
                Arg.Is<string>(x => x.Contains("GIATA code is empty")),
                Arg.Any<object>());
        }

        [Fact]
        public void ResolveHotelItem_ShouldReturnNull_WhenHotelIsNotFoundByGiata()
        {
            var request = new UpsertHotelRequest
            {
                GiataCode = "36363636"
            };

            destinationsRepository
                .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == request.GiataCode))
                .Returns(CreateEmptyHotelSearchResults());

            var result = service.ResolveHotelItem(request);

            result.Should().BeNull();

            logger.Received(1).Info(
                Arg.Is<string>(x => x.Contains($"Hotel with GIATA '{request.GiataCode}' not found")),
                Arg.Any<object>());
        }

        [Fact]
        public void ResolveHotelItem_ShouldReturnMasterItem_WhenHotelIsFoundByGiata()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    GiataCode = "36363636"
                };

                var searchResults = CreateHotelSearchResults(hotelItem, request.GiataCode);

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == request.GiataCode))
                    .Returns(searchResults);

                databaseProvider
                    .GetItem(hotelItem.ID, DatabaseType.Master)
                    .Returns(hotelItem);

                var result = service.ResolveHotelItem(request);

                result.Should().Be(hotelItem);

                databaseProvider.Received(1)
                    .GetItem(hotelItem.ID, DatabaseType.Master);
            }
        }

        [Fact]
        public void ResolveHotelItem_ShouldReturnNull_WhenHotelIsFoundByGiataButNotFoundInMaster()
        {
            using (var db = CreateHotelDb())
            {
                var hotelItem = db.GetItem("/sitecore/content/Hotel");

                var request = new UpsertHotelRequest
                {
                    GiataCode = "36363636"
                };

                var searchResults = CreateHotelSearchResults(hotelItem, request.GiataCode);

                destinationsRepository
                    .SearchHotelsByCodes(Arg.Is<string[]>(x => x.Length == 1 && x[0] == request.GiataCode))
                    .Returns(searchResults);

                databaseProvider
                    .GetItem(hotelItem.ID, DatabaseType.Master)
                    .Returns((Sitecore.Data.Items.Item)null);

                var result = service.ResolveHotelItem(request);

                result.Should().BeNull();

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("was not found in master database")),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void ResolveResortByCode_ShouldReturnNull_WhenCodeIsEmpty()
        {
            var result = service.ResolveResortByCode(" ");

            result.Should().BeNull();

            searchDatasourceRepository.DidNotReceiveWithAnyArgs()
                .GetItemByCode(default(string), default(ID), default(bool));
        }

        [Fact]
        public void ResolveResortByCode_ShouldReturnNull_WhenSearchDoesNotFindResort()
        {
            searchDatasourceRepository
                .GetItemByCode("PLKRKR", Constants.TemplateIds.Resort, false)
                .Returns((Sitecore.Data.Items.Item)null);

            var result = service.ResolveResortByCode("PLKRKR");

            result.Should().BeNull();

            databaseProvider.DidNotReceiveWithAnyArgs()
                .GetItem(default(ID), default(DatabaseType));
        }

        [Fact]
        public void ResolveResortByCode_ShouldReturnMasterResort_WhenSearchFindsResort()
        {
            using (var db = new Db
            {
                new DbItem("Existing Resort", ID.NewID, Constants.TemplateIds.Resort)
            })
            {
                var resortItem = db.GetItem("/sitecore/content/Existing Resort");

                searchDatasourceRepository
                    .GetItemByCode("PLKRKR", Constants.TemplateIds.Resort, false)
                    .Returns(resortItem);

                databaseProvider
                    .GetItem(resortItem.ID, DatabaseType.Master)
                    .Returns(resortItem);

                var result = service.ResolveResortByCode("PLKRKR");

                result.Should().Be(resortItem);

                searchDatasourceRepository.Received(1)
                    .GetItemByCode("PLKRKR", Constants.TemplateIds.Resort, false);

                databaseProvider.Received(1)
                    .GetItem(resortItem.ID, DatabaseType.Master);
            }
        }

        [Fact]
        public void ResolveResortByCode_ShouldReturnNull_WhenResortFoundBySearchButNotInMaster()
        {
            using (var db = new Db
            {
                new DbItem("Existing Resort", ID.NewID, Constants.TemplateIds.Resort)
            })
            {
                var resortItem = db.GetItem("/sitecore/content/Existing Resort");

                searchDatasourceRepository
                    .GetItemByCode("PLKRKR", Constants.TemplateIds.Resort, false)
                    .Returns(resortItem);

                databaseProvider
                    .GetItem(resortItem.ID, DatabaseType.Master)
                    .Returns((Sitecore.Data.Items.Item)null);

                var result = service.ResolveResortByCode("PLKRKR");

                result.Should().BeNull();

                logger.Received(1).Warn(
                    Arg.Is<string>(x => x.Contains("Resort with code 'PLKRKR'") && x.Contains("master database")),
                    Arg.Any<object>());
            }
        }

        private static Db CreateHotelDb()
        {
            return new Db
            {
                new DbItem("Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
                {
                    { Constants.Fields.AccommodationItem.GiataCode, "36363636" }
                }
            };
        }

        private static SearchResults<HotelSearchResultItem> CreateEmptyHotelSearchResults()
        {
            return new SearchResults<HotelSearchResultItem>(
                new List<SearchHit<HotelSearchResultItem>>(),
                0);
        }

        private static SearchResults<HotelSearchResultItem> CreateHotelSearchResults(
            Sitecore.Data.Items.Item hotelItem,
            string giataCode)
        {
            var document = new HotelSearchResultItem
            {
                GiataCode = giataCode,
                Uri = hotelItem.Uri
            };

            return new SearchResults<HotelSearchResultItem>(
                new List<SearchHit<HotelSearchResultItem>>
                {
            new SearchHit<HotelSearchResultItem>(1, document)
                },
                1);
        }
    }
}