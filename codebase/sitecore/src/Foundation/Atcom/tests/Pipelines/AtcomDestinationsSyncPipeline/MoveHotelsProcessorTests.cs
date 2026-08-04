using System.Collections.Generic;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models.Sitecore;
using easyJet.Foundation.Atcom.Pipelines.AtcomDestinationsSyncPipeline;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomDestinationsSyncPipeline
{
    public class MoveHotelsProcessorTests
    {
        private readonly Fixture fixture;
        private readonly Db db;

        private readonly ISyncDataService syncDataService;
        private readonly IAtcomLogger logger;
        private readonly MoveHotelsProcessor processor;
        private readonly IUserCreationService userCreationService;

        public MoveHotelsProcessorTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();

            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            processor = new MoveHotelsProcessor(syncDataService, logger, userCreationService);
        }

        [Fact]
        public void Process_ShouldCallLoggerWarn_IfSettingsNotAccessible()
        {
            // Arrange
            var args = new DestinationPipelineArgs();
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());

            // Act
            processor.Process(args);

            // Assert
            logger.Received(1).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldCallWarnTwice_IfArgsCustomDataNotContainsRegionsCustomDataKey()
        {
            // Arrange
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Info(Arg.Any<string>(), Arg.Any<object>());

            var args = new DestinationPipelineArgs();

            // Act
            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", "true"))
            {
                processor.Process(args);
            }

            // Assert
            logger.Received(2).Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Process_ShouldCallInfoTwice_IfHotelsWereMoved(string atcomHotelCode, string sitecoreHotelCode)
        {
            // Arrange
            logger.Info(Arg.Any<string>(), Arg.Any<object>());

            var resort = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            var atcomHotel = fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            atcomHotel.Fields.Add(Constants.Fields.DatasourceItem.Code, atcomHotelCode);

            var sitecoreHotel = fixture.Build<DbItem>().With(x => x.ParentID, resort.ID).Create();

            var sitecoreHotelWithAtcomHotelCode = fixture.Build<DbItem>().With(x => x.ParentID, resort.ID).Create();

            sitecoreHotel.Fields.Add(Constants.Fields.DatasourceItem.Code, sitecoreHotelCode);
            sitecoreHotelWithAtcomHotelCode.Fields.Add(Constants.Fields.DatasourceItem.Code, atcomHotelCode);

            resort.Children.Add(sitecoreHotel);
            resort.Children.Add(sitecoreHotelWithAtcomHotelCode);

            db.Add(atcomHotel);
            db.Add(resort);

            var regionsCustomDataKey = "Regions";

            var args = new DestinationPipelineArgs();

            var destinations = new List<Destination>
            {
                new Destination(db.GetItem(resort.ID))
                {
                    Children = new List<Destination>
                    {
                        new Destination(db.GetItem(atcomHotel.ID))
                        {
                        },
                        new Destination(db.GetItem(sitecoreHotelWithAtcomHotelCode.ID))
                        {
                        }
                    }
                }
            };

            args.CustomData.Add(regionsCustomDataKey, destinations);

            // Act
            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", "true"))
            {
                processor.Process(args);
            }

            // Assert
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
