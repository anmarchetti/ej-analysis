using System;
using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Pipelines.HotelBedsDestinationsUpdateSyncPipeline;
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
    public class SyncDestinationsProcessorTests
    {
        private readonly IDestinationsRepository hotelsRepository;
        private readonly ISyncDataService syncDataService;
        private readonly IHotelBedsLogger logger;
        private readonly SyncDestinationsProcessor syncDestinationsProcessor;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;

        public SyncDestinationsProcessorTests()
        {
            hotelsRepository = Substitute.For<IDestinationsRepository>();
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IHotelBedsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            syncDestinationsProcessor = new SyncDestinationsProcessor(syncDataService, hotelsRepository, databaseProvider, logger, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldCatchexception_IfServiceThrowException(Db db)
        {
            // Arrange
            var parentItem = new DbItem("Parent");
            db.Add(parentItem);

            hotelsRepository.When(x => x.GetAllHotels(Arg.Any<string>())).Do(x => throw new Exception());

            // Act
            syncDestinationsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs() { Parent = db.GetItem(parentItem.ID) });

            // Assert
            logger.ReceivedWithAnyArgs().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldSyncExternalAccommodationItemsOnly_IfExternalAccommodationOnlyIsTrue(Db db, string hotelBedsCode)
        {
            // Arrange
            var parent = new DbItem("Parent");

            var hotelBedsCodeField = new DbField(Destinations.Constants.Fields.AccommodationItem.HotelBedsCode) { Value = hotelBedsCode };
            var hotelDbItem = new DbItem($"Hotel-{hotelBedsCode}", ID.NewID, new TemplateID(Destinations.Constants.TemplateIds.Accommodation));
            hotelDbItem.Fields.Add(hotelBedsCodeField);
            parent.Add(hotelDbItem);

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

            var results = new SearchResults<HotelSyncSearchResultItem>(hints, 1);
            hotelsRepository.GetAllHotels(Arg.Any<string>()).Returns(results);
            syncDataService.UpdateAccommodations(Arg.Any<IDictionary<string, Item>>(), null, Arg.Any<DateTime?>(), Arg.Any<bool>()).Returns(new List<Item>() { db.GetItem(hotelDbItem.ID) });

            using (new SettingsSwitcher("HotelBeds.Hotels.SizeOfSubset", "1"))
            {
                // Act
                syncDestinationsProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs() { Parent = db.GetItem(parent.ID) });
                // Assert
                logger.Received().Info($"1 Hotels was updated from HotelBeds", Arg.Any<object>());
            }
        }
    }
}
