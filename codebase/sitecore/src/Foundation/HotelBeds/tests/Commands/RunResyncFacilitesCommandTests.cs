using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Commands;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Reports.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Commands
{
    public class RunResyncFacilitesCommandTests
    {
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly ISyncDataService syncDataService;
        private readonly IResyncFaciltitesReportService resyncFaciltitesReportService;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IHotelBedsLogger logger;

        private readonly RunResyncFacilitesCommand command;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunResyncFacilitesCommandTests()
        {
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            syncDataService = Substitute.For<ISyncDataService>();
            resyncFaciltitesReportService = Substitute.For<IResyncFaciltitesReportService>();
            logger = Substitute.For<IHotelBedsLogger>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = Substitute.ForPartsOf<RunResyncFacilitesCommand>(
                csvUtilsService,
                destinationsSearchService,
                syncDataService,
                resyncFaciltitesReportService,
                databaseProvider,
                logger,
                userCreationService,
                sitecoreUiService);
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeEmpty_IfThereNoCandidatesForResyning(Item item)
        {
            // Arrange
            var fileModel = new List<HotelFacilitesResyncRow>();
            var results = new List<BaseHotelSearchResultItem>();

            command.GetFileData<HotelFacilitesResyncRow>(Arg.Any<Item>()).Returns(fileModel);
            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = command.ProcessItems(item);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeEmpty_IfSearchHasNoHotels(Db db, Item item)
        {
            // Arrange
            var fileModel = new List<HotelFacilitesResyncRow>()
            {
                new HotelFacilitesResyncRow()
                {
                    GiataCode = "CODE2",
                    Name = "HotelName"
                }
            };

            var hits = new List<BaseHotelSearchResultItem>();
            var accommodationDbItem = new DbItem("Hotel 1")
            {
                new DbField(Destinations.Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = "CODE1"
                }
            };

            db.Add(accommodationDbItem);

            var accommodationItem = db.GetItem(accommodationDbItem.ID);

            hits.Add(new BaseHotelSearchResultItem()
            {
                Uri = accommodationItem.Uri,
                GiataCode = "CODE1"
            });

            command.GetFileData<HotelFacilitesResyncRow>(Arg.Any<Item>()).Returns(fileModel);
            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(hits);

            // Act
            var actual = command.ProcessItems(item);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldBeEmpty_IfHotelDoesNotHaveHotelBedsCode(Db db, Item item)
        {
            // Arrange
            var fileModel = new List<HotelFacilitesResyncRow>()
            {
                new HotelFacilitesResyncRow()
                {
                    GiataCode = "CODE1",
                    Name = "HotelName"
                }
            };

            var hits = new List<BaseHotelSearchResultItem>();
            var accommodationDbItem = new DbItem("Hotel 1")
            {
                new DbField(Destinations.Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = "CODE1"
                }
            };

            db.Add(accommodationDbItem);

            var accommodationItem = db.GetItem(accommodationDbItem.ID);

            hits.Add(new BaseHotelSearchResultItem()
            {
                Uri = accommodationItem.Uri,
                GiataCode = "CODE1"
            });

            command.GetFileData<HotelFacilitesResyncRow>(Arg.Any<Item>()).Returns(fileModel);
            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(hits);

            // Act
            var actual = command.ProcessItems(item);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SynchronizeItems_ShouldResyncFaciltities_IfThereAreCandidatesForResyncing(Db db, Item item)
        {
            // Arrange
            var fileModel = new List<HotelFacilitesResyncRow>()
            {
                new HotelFacilitesResyncRow()
                {
                    GiataCode = "CODE1",
                    Name = "HotelName"
                }
            };

            var hits = new List<BaseHotelSearchResultItem>();
            var accommodationDbItem = new DbItem("Hotel 1")
            {
                new DbField(Destinations.Constants.Fields.AccommodationItem.GiataCode)
                {
                    Value = "CODE1"
                },
                new DbField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode)
                {
                    Value = "HOTELBEDSCODE"
                }
            };

            db.Add(accommodationDbItem);

            var accommodationItem = db.GetItem(accommodationDbItem.ID);
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(accommodationItem);
            hits.Add(new BaseHotelSearchResultItem()
            {
                Uri = accommodationItem.Uri,
                GiataCode = "CODE1"
            });

            command.GetFileData<HotelFacilitesResyncRow>(Arg.Any<Item>()).Returns(fileModel);
            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).Returns(hits);
            syncDataService.ResyncFacilities(Arg.Any<Dictionary<string, HotelItem>>()).Returns(new List<Item>()
            {
                item
            });

            // Act
            var actual = command.ProcessItems(item);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
