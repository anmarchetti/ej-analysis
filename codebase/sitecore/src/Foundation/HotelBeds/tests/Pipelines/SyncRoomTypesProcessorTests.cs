using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Pipelines.HotelBedsRoomTypesSyncPipeline;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.HotelBeds.Tests.Pipelines
{
    public class SyncRoomTypesProcessorTests
    {
        private readonly ISyncDataService syncDataService;
        private readonly IHotelBedsLogger logger;
        private readonly SyncRoomTypesProcessor syncRoomTypesProcessor;
        private readonly IUserCreationService userCreationService;

        public SyncRoomTypesProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IHotelBedsLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            syncRoomTypesProcessor = new SyncRoomTypesProcessor(syncDataService, logger, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldReturnSyncedItems_IfIfDataExist(Db db, RoomType roomType)
        {
            // Arrange
            var parent = new DbItem("parent");

            var roomTypeDbItem = new DbItem("Room type", ID.NewID, Destinations.Constants.TemplateIds.RoomType);
            roomTypeDbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, roomType.Code);
            roomTypeDbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Name, roomType.Description);
            roomTypeDbItem.Fields.Add(Destinations.Constants.Fields.RoomType.TypeDescriptionContent, roomType.TypeDescription.Content);
            roomTypeDbItem.Fields.Add(Destinations.Constants.Fields.RoomType.CharacteristicDescriptionContent, roomType.CharacteristicDescription.Content);

            parent.Add(roomTypeDbItem);
            db.Add(parent);

            var parentItem = db.GetItem(parent.ID);
            var expectedSyncedItems = new Item[] { db.GetItem(roomTypeDbItem.ID) };
            syncDataService.SyncRoomTypes(Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<DateTime>()).Returns(expectedSyncedItems);

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                syncRoomTypesProcessor.Process(new Destinations.Pipelines.Arguments.DestinationPipelineArgs() { Parent = parentItem });

                // Assert
                logger.Received().Info($"{expectedSyncedItems.Length} room types was synchronized from HotelBeds", Arg.Any<object>());
            }
        }
    }
}
