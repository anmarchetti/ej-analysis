using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Pipelines.AtcomAirportsSyncPipeline;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomAirpotsSyncPipeline
{
    public class SyncAirportsCountriesProcessorTests
    {
        private readonly SyncAirportsCountriesProcessor processor;
        private readonly IAtcomLogger logger;
        private readonly ISyncDataService syncDataService;
        private readonly IMasterDataService masterDataService;
        private readonly IUserCreationService userCreationService;

        public SyncAirportsCountriesProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            processor = new SyncAirportsCountriesProcessor(syncDataService, logger, userCreationService);
            masterDataService = Substitute.For<IMasterDataService>();
        }

        [Theory]
        [AutoDbData]
        public void Process_ShouldReciveAirportsCountries(DestinationPipelineArgs args, Item[] expectedItems)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                syncDataService.SyncAirportsCountries(Arg.Any<ID>(), Arg.Any<Item>()).Returns(args.Items);

                // Act
                processor.Process(args);

                // Assert
                args.Items.Should().HaveCount(expectedItems.Length);
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
