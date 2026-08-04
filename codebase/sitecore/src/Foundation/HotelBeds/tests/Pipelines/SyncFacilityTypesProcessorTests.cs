using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Pipelines.HotelBedsFacilityTypesSyncPipeline;
using easyJet.Foundation.HotelBeds.Services.Sync;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.HotelBeds.Tests.Pipelines
{
    public class SyncFacilityTypesProcessorTests
    {
        private readonly ISyncDataService syncDataService;
        private readonly IHotelBedsLogger logger;
        private readonly SyncFacilityTypesProcessor syncFacilityTypesProcessor;
        private readonly IUserCreationService userCreationService;

        public SyncFacilityTypesProcessorTests()
        {
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IHotelBedsLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            syncFacilityTypesProcessor = new SyncFacilityTypesProcessor(syncDataService, logger, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldSyncFacilities_IfDataExist(Db db, FacilityGroup facilityGroup)
        {
            // Arrange
            var parent = new DbItem("Parent", ID.NewID);

            var dbItem = new DbItem("Db item", ID.NewID, Destinations.Constants.TemplateIds.FacilityTypesGroup);
            dbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Code, facilityGroup.Code);
            dbItem.Fields.Add(Destinations.Constants.Fields.DatasourceItem.Name, dbItem.Name);
            parent.Add(dbItem);

            db.Add(parent);

            syncDataService.SyncFacilityGroups(Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<DateTime>()).Returns(new Item[] { db.GetItem(dbItem.ID) });

            // Act
            syncFacilityTypesProcessor.ProcessSync(new Destinations.Pipelines.Arguments.DestinationPipelineArgs() { Parent = db.GetItem(parent.ID) });

            // Assert
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
