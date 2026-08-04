using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Pipelines.AtcomAirportsSyncPipeline;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Security.Accounts;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomAirpotsSyncPipeline
{
    public class SyncAirportsProcessorTests
    {
        private readonly SyncAirportsProcessor processor;
        private readonly IAtcomLogger logger;
        private readonly ISyncDataService syncDataService;
        private readonly IMasterDataService masterDataService;
        private readonly IUserCreationService userCreationService;

        public SyncAirportsProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            masterDataService = Substitute.For<IMasterDataService>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            processor = new SyncAirportsProcessor(syncDataService, logger, userCreationService);
        }

        [Theory]
        [AutoDbData]
        public void Process_SyncAirports_IfCodeNotEqualNull(string code, ID templateId, ID id, Item parent, Db db, DestinationPipelineArgs args)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                db.Add(new DbItem("FakeItem", id) { new DbField("Code") { Value = code } });
                args.Items = new Item[] { db.GetItem(id) };

                // Act
                processor.Process(args);

                // Assert
                syncDataService.ReceivedWithAnyArgs().SyncAirports(code, templateId, parent);
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_DontSyncAirports_IfCodeEqualNull(ID templateId, Item parent, DestinationPipelineArgs args)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                processor.Process(args);

                // Assert
                syncDataService.DidNotReceive().SyncAirports(null, templateId, parent);
            }
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldCallLoggerWarn_IfSettingsNotAccessible(DestinationPipelineArgs args)
        {
            // Arrange
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());

            // Act
            processor.Process(args);

            // Assert
            logger.ReceivedWithAnyArgs().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
