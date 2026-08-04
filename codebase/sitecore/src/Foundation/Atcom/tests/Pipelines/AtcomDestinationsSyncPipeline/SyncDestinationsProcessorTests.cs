using System;
using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.Atcom.Models.Sitecore;
using easyJet.Foundation.Atcom.Pipelines.AtcomDestinationsSyncPipeline;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Destinations;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Pipelines.AtcomDestinationsSyncPipeline
{
    public class SyncDestinationsProcessorTests
    {
        private readonly IVrpWebService vrpWebService;
        private readonly ISyncDataService syncDataService;
        private readonly ISearchService searchService;
        private readonly IAtcomLogger logger;
        private readonly SyncDestinationsProcessor processor;
        private readonly IUserCreationService userCreationService;

        public SyncDestinationsProcessorTests()
        {
            vrpWebService = Substitute.For<IVrpWebService>();
            searchService = Substitute.For<ISearchService>();
            syncDataService = Substitute.For<ISyncDataService>();
            logger = Substitute.For<IAtcomLogger>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            processor = new SyncDestinationsProcessor(syncDataService, vrpWebService, searchService, logger, userCreationService);
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldSyncDestinationsAndReturnAllResorts_IfDataSuccssesfullyRecived(Db db, DataObject countryDataObject, DataObject locationDataObject, DataObject resortDataObject, DataObject hotelDataObject, Dictionary<string, AccommodationHeaderDataEntry> vrpData)
        {
            // Arrange
            var country = CreateAndGetDestination(db, countryDataObject, Constants.TemplateIds.Country);
            var location = CreateAndGetDestination(db, locationDataObject, Constants.TemplateIds.Location, country);
            var resort = CreateAndGetDestination(db, resortDataObject, Constants.TemplateIds.Resort, location);
            var hotel = CreateAndGetDestination(db, hotelDataObject, Constants.TemplateIds.Accommodation, resort);

            vrpWebService.GetDataCollection().Returns(vrpData);
            syncDataService.SyncCountries(Constants.TemplateIds.Country, Arg.Any<Item>()).Returns(new Item[] { country });
            syncDataService.SyncLocations(countryDataObject.Code, Constants.TemplateIds.Location, country).Returns(new Item[] { location });
            syncDataService.SyncResorts(locationDataObject.Code, Constants.TemplateIds.Resort, location).Returns(new Item[] { resort });
            syncDataService.SyncAccommodations(resortDataObject.Code, Constants.TemplateIds.Accommodation, resort, vrpData).Returns(new Item[] { hotel });
            var args = new Destinations.Pipelines.Arguments.DestinationPipelineArgs();

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                processor.Process(args);

                var result = args.CustomData["Regions"] as IEnumerable<Destination>;

                // Assert
                result.Should().NotBeNull();
                result.Should().HaveCount(1);
                result.ElementAt(0).Item.Should().Be(resort);
                result.ElementAt(0).Children.ElementAt(0).Item.Should().Be(hotel);
            }
        }

        [Theory]
        [AutoData]
        public void ProcessSync_ShouldCatchException_IfServiceThrowException(Db db, DataObject countryDataObject, DataObject locationDataObject, DataObject resortDataObject, DataObject hotelDataObject, Dictionary<string, AccommodationHeaderDataEntry> vrpData)
        {
            // Arrange
            var country = CreateAndGetDestination(db, countryDataObject, Constants.TemplateIds.Country);
            var location = CreateAndGetDestination(db, locationDataObject, Constants.TemplateIds.Location, country);
            var resort = CreateAndGetDestination(db, resortDataObject, Constants.TemplateIds.Resort, location);
            var hotel = CreateAndGetDestination(db, hotelDataObject, Constants.TemplateIds.Accommodation, resort);

            vrpWebService.GetDataCollection().Returns(vrpData);
            syncDataService.SyncCountries(Constants.TemplateIds.Country, Arg.Any<Item>()).Returns(new Item[] { country });
            syncDataService.SyncLocations(countryDataObject.Code, Constants.TemplateIds.Location, country).Returns(new Item[] { location });
            syncDataService.SyncResorts(locationDataObject.Code, Constants.TemplateIds.Resort, location).Returns(new Item[] { resort });
            syncDataService.SyncAccommodations(resortDataObject.Code, Constants.TemplateIds.Accommodation, resort, vrpData).Throws<Exception>();
            var args = new Destinations.Pipelines.Arguments.DestinationPipelineArgs();

            using (new SettingsSwitcher("Destinations.IsAutoSyncEnabled", bool.TrueString))
            {
                // Act
                processor.Process(args);

                var result = args.CustomData["Regions"] as IEnumerable<Destination>;

                // Assert
                result.Should().NotBeNull();
                result.Should().HaveCount(1);
                result.ElementAt(0).Item.Should().Be(resort);
                logger.Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            }
        }

        private Item CreateAndGetDestination(Db db, DataObject dataObject, ID templateId, Item parent = null)
        {
            var destinationDbItem = new DbItem(dataObject.Name, ID.NewID, templateId);
            if (parent != null)
            {
                destinationDbItem.ParentID = parent.ID;
            }

            destinationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, dataObject.Name);
            destinationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, dataObject.Code);
            db.Add(destinationDbItem);

            return db.GetItem(destinationDbItem.ID);
        }
    }
}
