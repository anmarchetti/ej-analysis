using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Pipelines.AtcomRoomTypeFacilitiesSyncPipeline;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomRoomTypeFacilitiesSyncPipeline
{
    public class SyncAccommodationRoomTypesProcessorTests
    {
        private readonly ISyncDataService syncDataService;
        private readonly IAtcomLogger logger;
        private readonly SyncAccommodationRoomTypesProcessor processor;
        private IUserCreationService userCreationService;

        public SyncAccommodationRoomTypesProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            processor = new SyncAccommodationRoomTypesProcessor(syncDataService, logger, userCreationService);
        }

        [Theory]
        [AutoDbData]
        public void ProcessSync_ShouldReturnSyncedItems_IfSyncDataServiceSyncedItems(Item[] syncedItems)
        {
            // Arrange
            syncDataService.SyncAccommodationRoomTypes().Returns(syncedItems);

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                processor.Process(new DestinationPipelineArgs());

                // Assert
                logger.Received().Info($"{syncedItems.Length} accommodations were synchronized from Atcom hybris service.", Arg.Any<object>());
            }
        }
    }
}
