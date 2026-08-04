using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Pipelines.HotelBedsRoomsSyncPipeline;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.HotelBeds.Tests.Pipelines
{
    public class SyncRoomsProcessorTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsRepository destinationsRepository;
        private readonly IHotelBedsLogger logger;
        private readonly IMasterDataService masterDataService;
        private readonly ISyncDataService syncDataService;
        private readonly SyncRoomsProcessor syncRoomsProcessor;
        private readonly IUserCreationService userCreationService;

        public SyncRoomsProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            logger = Substitute.For<IHotelBedsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            masterDataService = Substitute.For<IMasterDataService>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            syncRoomsProcessor = new SyncRoomsProcessor(masterDataService, syncDataService, logger, destinationsRepository, databaseProvider, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldCatchexception_IfServiceThrowException(Db db)
        {
            // Arrange
            var parentItem = new DbItem("Parent");
            db.Add(parentItem);

            destinationsRepository.When(x => x.GetAllHotels(Arg.Any<string>(), Arg.Any<int>())).Do(x => throw new Exception());

            // Act
            syncRoomsProcessor.ProcessSync(new DestinationPipelineArgs() { Parent = db.GetItem(parentItem.ID) });

            // Assert
            logger.ReceivedWithAnyArgs().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldReturnSyncedItems_IfDataExist(Db db, string hotelBedsCode, Accommodation accommodation)
        {
            // Arrange
            var parent = new DbItem("Parent");

            var hotelBedsCodeField = new DbField(DestinationsConstants.Fields.AccommodationItem.HotelBedsCode) { Value = hotelBedsCode };
            var hotelDbItem = new DbItem($"Hotel-{hotelBedsCode}", ID.NewID, new TemplateID(DestinationsConstants.TemplateIds.Accommodation));
            var roomDbItem = new DbItem($"Room-{hotelBedsCode}", ID.NewID, new TemplateID(DestinationsConstants.TemplateIds.AccommodationRoom));

            hotelDbItem.Fields.Add(hotelBedsCodeField);
            parent.Add(hotelDbItem);
            parent.Add(roomDbItem);
            db.Add(parent);

            var hints = new List<SearchHit<HotelSyncSearchResultItem>>()
            {
                {
                    new SearchHit<HotelSyncSearchResultItem>(1, new HotelSyncSearchResultItem()
                    {
                        Uri = new ItemUri(db.GetItem(hotelDbItem.ID)),
                        ItemId = hotelDbItem.ID,
                        HotelBedsCode = hotelBedsCode
                    })
                }
            };
            accommodation.Code = hotelBedsCode;
            var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);

            destinationsRepository.GetAllHotels(Arg.Any<string>(), Arg.Any<int>()).Returns(results);
            syncDataService.SyncAccommodationRooms(accommodation, Arg.Any<Item>())
                .Returns(new List<Item>() { db.GetItem(roomDbItem.ID) });

            masterDataService.GetAccommodations(Arg.Any<string[]>()).Returns(new List<Accommodation>() { accommodation });

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                syncRoomsProcessor.Process(new DestinationPipelineArgs() { Parent = db.GetItem(parent.ID) });

                // Assert
                logger.Received().Info($"1 rooms was synchronized for 1 accommodations from HotelBeds", Arg.Any<object>());
            }
        }
    }
}
