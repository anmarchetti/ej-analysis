using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypesSyncPipeline;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomRoomTypesSyncPipeline
{
    public class SyncRoomTypesProcessorTests
    {
        private readonly ISyncDataService syncDataService;
        private readonly IAtcomLogger logger;
        private readonly SyncRoomTypesProcessor syncRoomTypesProcessor;
        private readonly IUserCreationService userCreationService;

        public SyncRoomTypesProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            syncRoomTypesProcessor = new SyncRoomTypesProcessor(syncDataService, logger, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldReturnSyncedItems_IfIfDataExist(Db db, DataObject dataObject)
        {
            // Arrange
            var parent = new DbItem("parent");

            var roomTypeDbItem = new DbItem($"{dataObject.Code} - {dataObject.Name}", ID.NewID, DestinationsConstants.TemplateIds.RoomType);
            roomTypeDbItem.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Code, dataObject.Code);
            roomTypeDbItem.Fields.Add(DestinationsConstants.Fields.DatasourceItem.Name, dataObject.Name);

            parent.Add(roomTypeDbItem);
            db.Add(parent);

            var parentItem = db.GetItem(parent.ID);
            var expectedSyncedItems = new Item[] { db.GetItem(roomTypeDbItem.ID) };
            syncDataService.SyncRoomTypes(Arg.Any<ID>(), Arg.Any<Item>()).Returns(expectedSyncedItems);

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                syncRoomTypesProcessor.Process(new Destinations.Pipelines.Arguments.DestinationPipelineArgs() { Parent = parentItem });

                // Assert
                logger.Received().Info($"{expectedSyncedItems.Length} room types was synchronized from ATcom", Arg.Any<object>());
            }
        }
    }
}
