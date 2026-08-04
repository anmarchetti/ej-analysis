using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Models.Domain;
using easyJet.Foundation.Atcom.Models.External;
using easyJet.Foundation.Atcom.Services;
using easyJet.Foundation.Atcom.Services.Sync;
using easyJet.Foundation.Atcom.Tests.DbItems;
using easyJet.Foundation.Destinations.Integration;
using easyJet.Foundation.Destinations.Integration.Models;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using NSubstitute.ReturnsExtensions;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Sitecore.Workflows;
using Xunit;
using Constants = easyJet.Foundation.Destinations.Constants;
using IMasterDataService = easyJet.Foundation.Atcom.Services.IMasterDataService;
using MultisiteConstants = easyJet.Foundation.Multisite.Constants;
using Version = Sitecore.Data.Version;

namespace easyJet.Foundation.Atcom.Tests.Services.Sync
{
    public class SyncDataServiceTests
    {
        private readonly IMasterDataService masterDataService;
        private readonly IHotelThemesService hotelThemeService;
        private readonly IDatasourceRepository repository;
        private readonly IAirportsService airportsService;
        private readonly IVrpWebService vrpService;
        private readonly IProfileService profileService;
        private readonly IAtcomLogger logger;
        private readonly IWorkflowProvider workflowProvider;
        private readonly IWorkflow workflow;
        private readonly SyncDataService syncDataService;
        private readonly IHybrisService hybrisService;
        private readonly ISearchDatasourceRepository searchDatasource;
        private readonly ISitecoreContext sitecoreContext;
        private readonly IIntegrationService integrationService;
        private readonly IRegionRestrictionService regionRestrictionService;
        private readonly IExcludeDataObjectsService excludeDataObjectsService;
        private readonly IDatabaseProvider databaseProvider;

        public SyncDataServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            hotelThemeService = Substitute.For<IHotelThemesService>();
            repository = Substitute.For<IDatasourceRepository>();
            airportsService = Substitute.For<IAirportsService>();
            vrpService = Substitute.For<IVrpWebService>();
            profileService = Substitute.For<IProfileService>();
            logger = Substitute.For<IAtcomLogger>();
            workflowProvider = Substitute.For<IWorkflowProvider>();
            workflow = Substitute.For<IWorkflow>();
            hybrisService = Substitute.For<IHybrisService>();
            searchDatasource = Substitute.For<ISearchDatasourceRepository>();
            sitecoreContext = Substitute.For<ISitecoreContext>();
            integrationService = Substitute.For<IIntegrationService>();
            regionRestrictionService = Substitute.For<IRegionRestrictionService>();
            excludeDataObjectsService = Substitute.For<IExcludeDataObjectsService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            syncDataService = new SyncDataService(masterDataService, repository, airportsService, hotelThemeService, vrpService, profileService, hybrisService, searchDatasource, sitecoreContext, integrationService, regionRestrictionService, excludeDataObjectsService, databaseProvider, logger);
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypes_ShouldSuccessfullySyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            masterDataService.GetRoomCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncRoomTypes(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().NotBeNull();
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypes_ShouldSyncDataForAllSyncLanguages(ID templateId, Item parent)
        {
            // Arrange
            var syncLanguages = new string[] { "en", "de-CH", "fr-CH" };
            using (new SettingsSwitcher("Atcom.SyncLanguages", string.Join("|", syncLanguages)))
            {
                masterDataService.GetRoomCodes(Arg.Any<string>())
                                 .Returns(Enumerable.Empty<DataObject>());

                // Act
                var result = syncDataService.SyncRoomTypes(templateId, parent);

                // Assert
                result.Should().NotBeNull();
                masterDataService.GetRoomCodes(Arg.Any<string>()).Received(syncLanguages.Length);
            }
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypes_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetRoomCodes()
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncRoomTypes(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomFacilities_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            masterDataService.GetRoomFacilities()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncRoomFacilities(templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomFacilities_ShouldNotSyncDataIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            masterDataService.GetRoomFacilities()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncRoomFacilities(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomFacilities_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetRoomFacilities()
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncRoomFacilities(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncStarRatings_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            masterDataService.GetStarRatingCodes()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncStarRatings(templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncStarRatings_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetStarRatingCodes()
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncStarRatings(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncCountries_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            masterDataService.GetCountryCodes()

                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncCountries_ShouldNotSyncDataIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);

            masterDataService.GetCountryCodes()

                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncCountries_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetCountryCodes()
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAirportsCountries_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            masterDataService.GetCountryCodes()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncAirportsCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncAirportsCountries_ShouldNotSyncIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            masterDataService.GetCountryCodes()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncAirportsCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAirportsCountries_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetCountryCodes()
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncAirportsCountries(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAirports_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetAirports(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));
            parent.Editing.BeginEdit();
            parent.Name = "Fake item";
            parent.Editing.EndEdit();

            // Act
            var actual = syncDataService.SyncAirports("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncAirports_ShouldNotSyncDataIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetAirports(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));
            parent.Editing.BeginEdit();
            parent.Name = "Fake item";
            parent.Editing.EndEdit();

            // Act
            var actual = syncDataService.SyncAirports("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAirports_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetAirports(Arg.Any<string>())
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncAirports(string.Empty, templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAirports_ShouldSuccessfulSyncData_IfUseDeepSearch(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetAirports(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), true, Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));
            parent.Editing.BeginEdit();
            parent.Name = "Fake item";
            parent.Editing.EndEdit();

            // Act
            var actual = syncDataService.SyncAirports("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncAirports_ShouldNotSyncIfExcluded_IfUseDeepSearch(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetAirports(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), true, Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));
            parent.Editing.BeginEdit();
            parent.Name = "Fake item";
            parent.Editing.EndEdit();

            // Act
            var actual = syncDataService.SyncAirports("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncLocations_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetLocationCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncLocations("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncLocations_ShouldNotSyncDataIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetLocationCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncLocations("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncLocations_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetLocationCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncLocations(string.Empty, templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncResorts_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetResortCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncResorts("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Theory]
        [AutoDbData]
        public void SyncResorts_ShouldNotSyncDataIfExcluded(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetResortCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>(), Arg.Any<Version>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncResorts("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncResorts_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetResortCodes(Arg.Any<string>())
                .Returns(new List<DataObject> { });

            // Act
            var actual = syncDataService.SyncResorts(string.Empty, templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldSuccessfulSyncData(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, DataObject dataObject, AccommodationData accommodationData)
        {
            // Arrange
            DisableExcludedDataObjectService();
            var expected = new AtcomAccommodationMasterDataObject(dataObject.Code, null, dataObject.Name, null, null, null, null, null);
            Context.Database.WorkflowProvider = workflowProvider;

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            var vrpDataByCode = new Dictionary<string, AccommodationHeaderDataEntry>()
            {
                { expected.Code, new AccommodationHeaderDataEntry() { AccommodationData = new AccommodationData[] { accommodationData } } }
            };

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent, vrpDataByCode).FirstOrDefault();
            var item = Context.Database.GetItem(actual.ID);

            // Assert
            item.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
            item.Fields[Constants.Fields.AccommodationItem.StarRating].Value.Should().Be(accommodationData.Star_Rating);
            item.Fields[Constants.Fields.AccommodationItem.City].Value.Should().Be(accommodationData.Add.City);
            item.Fields[Constants.Fields.AccommodationItem.Address].Value.Should().Be(accommodationData.Add.Street);
            item.Fields[Constants.Fields.AccommodationItem.PostalCode].Value.Should().Be(accommodationData.Add.ZipCode);
            item.Fields[Constants.Fields.AccommodationItem.Email].Value.Should().Be(accommodationData.Email.Address);
            item.Fields[Constants.Fields.AccommodationItem.HotelPhone].Value.Should().Be(accommodationData.Comm.FirstOrDefault().Num);
        }

        [Theory]
#pragma warning disable CS0618 // Type or member is obsolete
        [AutoDbData]
#pragma warning restore CS0618 // Type or member is obsolete
        public void SyncAccommodations_ShouldSuccessfulSyncData2(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, DataObject dataObject, AccommodationData accommodationData)
        {
            // Arrange
            DisableExcludedDataObjectService();
            var expected = new AtcomAccommodationMasterDataObject(dataObject.Code, null, dataObject.Name, null, null, null, null, null);
            Context.Database.WorkflowProvider = workflowProvider;

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            integrationService.SetIntegrationStrategy(expected.Code).ReturnsNull();

            var vrpDataByCode = new Dictionary<string, AccommodationHeaderDataEntry>()
            {
                { expected.Code, new AccommodationHeaderDataEntry() { AccommodationData = new AccommodationData[] { accommodationData } } }
            };

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent, vrpDataByCode).FirstOrDefault();
            var item = Context.Database.GetItem(actual.ID);

            // Assert
            item.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
            item.Fields[Constants.Fields.AccommodationItem.StarRating].Value.Should().Be(accommodationData.Star_Rating);
            item.Fields[Constants.Fields.AccommodationItem.City].Value.Should().Be(accommodationData.Add.City);
            item.Fields[Constants.Fields.AccommodationItem.Address].Value.Should().Be(accommodationData.Add.Street);
            item.Fields[Constants.Fields.AccommodationItem.PostalCode].Value.Should().Be(accommodationData.Add.ZipCode);
            item.Fields[Constants.Fields.AccommodationItem.Email].Value.Should().Be(accommodationData.Email.Address);
            item.Fields[Constants.Fields.AccommodationItem.HotelPhone].Value.Should().Be(accommodationData.Comm.FirstOrDefault().Num);
            logger.Received().Warn($"Integration strategy is null for {expected.Code}", Arg.Any<object>());
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldReturnNull_IfResponseEmpty(ID templateId, Item parent)
        {
            // Arrange
            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { });

            // Act
            var actual = syncDataService.SyncAccommodations(string.Empty, templateId, parent, null).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldAssignValuesFromMasterDataService_IfValuesNotNull(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, AtcomAccommodationMasterDataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent, null, null).FirstOrDefault().Versions.GetLatestVersion();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
            actual.Fields[Constants.Fields.AccommodationItem.City].Value.Should().Be(expected.City);
            actual.Fields[Constants.Fields.AccommodationItem.Address].Value.Should().Be(expected.Address);
            actual.Fields[Constants.Fields.AccommodationItem.PostalCode].Value.Should().Be(expected.PostalCode);
            actual.Fields[Constants.Fields.AccommodationItem.Email].Value.Should().Be(expected.Email);
            actual.Fields[Constants.Fields.AccommodationItem.HotelPhone].Value.Should().Be(expected.Phone);
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldAssignCoordinatesAndThemeWithType_IfDataNotNull(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, AtcomAccommodationMasterDataObject expected, AtcomAccommodation accommodation)
        {
            DisableExcludedDataObjectService();
            // Arrange
            Context.Database.WorkflowProvider = workflowProvider;
            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));
            var hotelThemesTypes = new Dictionary<string, ThemeTypeIds>();
            hotelThemesTypes.Add(accommodation.TypeCode, new ThemeTypeIds(null)
            {
                ThemeId = ID.NewID,
                TypeId = ID.NewID
            });

            hotelThemeService.GetThemeAndTypeIdsGroupedByTypeCode(Arg.Any<string>())
                .Returns(hotelThemesTypes);

            profileService.TagProfile(Arg.Any<Item>(), Arg.Any<string>(), Arg.Any<List<string>>())
                .Returns(true);

            var accommodationsByCode = new Dictionary<string, AtcomAccommodation> { { expected.Code, accommodation } };

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent, null, accommodationsByCode).FirstOrDefault();
            var item = Context.Database.GetItem(actual.ID);

            // Assert
            item.Fields[Constants.Fields.AccommodationItem.HotelTheme].Value.Should().Be(hotelThemesTypes[accommodation.TypeCode].ThemeId.ToString());
            item.Fields[Constants.Fields.AccommodationItem.Types].Value.Should().Be(hotelThemesTypes[accommodation.TypeCode].TypeId.ToString());
            item.Fields[Constants.Fields.AccommodationItem.Longitude].Value.Should().Be(accommodation.Longitude.ToString());
            item.Fields[Constants.Fields.AccommodationItem.Latitude].Value.Should().Be(accommodation.Latitude.ToString());
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldAssignEmptyValues_AccommodationDataEmpty(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, DataObject dataObject)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;
            var expected = new AtcomAccommodationMasterDataObject(dataObject.Code, string.Empty, dataObject.Name, null, null, null, null, null);

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            var vrpDataByCode = new Dictionary<string, AccommodationHeaderDataEntry>()
            {
                { expected.Code, new AccommodationHeaderDataEntry() { AccommodationData = new AccommodationData[] { } } }
            };

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent, vrpDataByCode).FirstOrDefault();
            var item = Context.Database.GetItem(actual.ID);

            // Assert
            item.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
            item.Fields[Constants.Fields.AccommodationItem.GiataCode].Value.Should().Be(expected.GiataCode);
            item.Fields[Constants.Fields.AccommodationItem.StarRating].Value.Should().BeEmpty();
            item.Fields[Constants.Fields.AccommodationItem.City].Value.Should().BeEmpty();
            item.Fields[Constants.Fields.AccommodationItem.Address].Value.Should().BeEmpty();
            item.Fields[Constants.Fields.AccommodationItem.PostalCode].Value.Should().BeEmpty();
            item.Fields[Constants.Fields.AccommodationItem.Email].Value.Should().BeEmpty();
            item.Fields[Constants.Fields.AccommodationItem.HotelPhone].Value.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldAssignHotelBedsCode_IfIntegrationCodeIsHotelBedsCode(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, AtcomAccommodationMasterDataObject expected, int code)
        {
            // Arrange
            DisableExcludedDataObjectService();
            expected.Code = $"X9{code}";

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(code.ToString());

            var service = new SyncDataService(masterDataService, repository, airportsService, hotelThemeService, vrpService, profileService, hybrisService, searchDatasource, sitecoreContext, integrationService, regionRestrictionService, excludeDataObjectsService, databaseProvider, logger);

            // Act
            var actual = service.SyncAccommodations("code1", templateId, parent).FirstOrDefault().Versions.GetLatestVersion();

            // Assert
            actual.Fields[Constants.Fields.AccommodationItem.HotelBedsCode].Value.Should().Be(code.ToString());
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldNotAssignHotelBedsCode_IfItNotStartsWithPrefix(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, AtcomAccommodationMasterDataObject expected, int code)
        {
            // Arrange
            DisableExcludedDataObjectService();
            expected.Code = code.ToString();
            Context.Database.WorkflowProvider = workflowProvider;

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            repository.GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(string.Empty);

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.AccommodationItem.HotelBedsCode].Value.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodations_ShouldCreateNewItemVersion_IfExistsChangedFieldInItem(ID templateId, Item parent, DatasourceDbItem roomFolder, AccommodationDbItem expectedItem, AtcomAccommodationMasterDataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            Context.Database.WorkflowProvider = workflowProvider;

            expectedItem.Add(new DbField(FieldIDs.WorkflowState)
            {
                Value = new ID(Guid.NewGuid()).ToString()
            });

            masterDataService.GetAccommodations(Arg.Any<string>())
                .Returns(new List<AtcomAccommodationMasterDataObject> { expected });
            searchDatasource.GetItemByCode(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(Context.Database.GetItem(roomFolder.ID));

            integrationService
                .SetIntegrationStrategy(Arg.Any<ChanelTypes>())
                .FormatNameWithAbbv(Arg.Any<string>())
                .Returns("Rooms");

            integrationService
                .SetIntegrationStrategy(Arg.Is<ChanelTypes>(x => x == ChanelTypes.HotelBeds))
                .ExtractCode(Arg.Any<IEnumerable<string>>())
                .Returns(expected.Code);

            // Act
            var actual = syncDataService.SyncAccommodations("code1", templateId, parent).FirstOrDefault().Versions.Count;

            // Assert
            actual.Should().Be(2);
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypeFacilities_ShouldSyncData_IfHybrisServiceReturnsData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            excludeDataObjectsService.IsExcluded(expected.Code).Returns(true);
            hybrisService.GetRoomTypeFacilities()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncRoomTypeFacilities(templateId, parent).FirstOrDefault();

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void SyncRoomTypeFacilities_ShouldNotSyncData_IfExcluded_IfHybrisServiceReturnsData(ID templateId, Item parent, DatasourceDbItem expectedItem, DataObject expected)
        {
            // Arrange
            DisableExcludedDataObjectService();
            hybrisService.GetRoomTypeFacilities()
                .Returns(new List<DataObject> { expected });
            repository.GetOrCreateItemByCode(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>(), Arg.Any<bool>())
                .Returns(Context.Database.GetItem(expectedItem.ID));

            // Act
            var actual = syncDataService.SyncRoomTypeFacilities(templateId, parent).FirstOrDefault();

            // Assert
            actual.Fields[Constants.Fields.DatasourceItem.Code].Value.Should().Be(expected.Code);
            actual.Fields[Constants.Fields.DatasourceItem.Name].Value.Should().Be(expected.Name);
        }

        [Fact]
        public void SyncAccommodationRoomTypes_ShouldBeEmpty_IfHybrisServiceHasNoData()
        {
            // Arrange
            var data = new Dictionary<string, List<RoomTypeFacilities>>();
            hybrisService.GetAccommodationRoomTypes().Returns(data);

            // Act
            var actual = syncDataService.SyncAccommodationRoomTypes().ToList();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void SyncAccommodationRoomTypes_ShouldLogWarn_IfSearchDataDidNotFindHotelWithCode()
        {
            // Arrange
            var data = new Dictionary<string, List<RoomTypeFacilities>>()
            {
                 { "hotelCode", new List<RoomTypeFacilities>() }
            };
            Item item = null;

            hybrisService.GetAccommodationRoomTypes().Returns(data);
            searchDatasource.GetItemByCode(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>()).Returns(item);

            // Act
            var actual = syncDataService.SyncAccommodationRoomTypes().ToList();

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodationRoomTypes_ShouldLogWarn_IfRegionRestrictionSkippedRoom(Item item, Item settingsItem, List<Item> regionRestrictionsItems)
        {
            // Arrange
            var data = new Dictionary<string, List<RoomTypeFacilities>>
            {
                { "hotelCode", new List<RoomTypeFacilities>() }
            };

            hybrisService.GetAccommodationRoomTypes().Returns(data);
            regionRestrictionService.GetSettingsItem(Arg.Any<string>()).ReturnsForAnyArgs(settingsItem);
            regionRestrictionService.GetRegionRestrictionItems(settingsItem).Returns(regionRestrictionsItems);
            searchDatasource.GetItemByCode(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>()).ReturnsForAnyArgs(item);

            // Act
            var actual = syncDataService.SyncAccommodationRoomTypes().ToList();

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodationRoomTypes_ShouldLogDebug_IfRegionRestrictionProcessedRoom(Item settingsItem, List<Item> regionRestrictionsItems)
        {
            // Arrange
            var data = new Dictionary<string, List<RoomTypeFacilities>>
            {
                { "hotelCode", new List<RoomTypeFacilities>() }
            };

            hybrisService.GetAccommodationRoomTypes().Returns(data);
            regionRestrictionService.GetSettingsItem(Arg.Any<string>()).ReturnsForAnyArgs(settingsItem);
            regionRestrictionService.GetRegionRestrictionItems(settingsItem).Returns(regionRestrictionsItems);
            searchDatasource.GetItemByCode(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>()).ReturnsForAnyArgs(regionRestrictionsItems[0]);

            // Act
            var actual = syncDataService.SyncAccommodationRoomTypes().ToList().Count;

            // Assert
            logger.Received().Debug(Arg.Any<string>(), Arg.Any<object>());
            actual.Should().Be(1);
        }

        [Theory]
        [AutoDbData]
        public void SyncAccommodationRoomTypes_ShouldCreateRoom_IfNoRoomWithProvidedCodeInHotel(
            Db db,
            Item hotelItem,
            Item roomFolder,
            RoomDbItem roomDbItem)
        {
            // Arrange
            var data = new Dictionary<string, List<RoomTypeFacilities>>()
            {
                {
                    "hotelCode", new List<RoomTypeFacilities>()
                    {
                        new RoomTypeFacilities("roomCode", "roomName")
                    }
                }
            };

            var atcomRoomTypesFolderItem = new DbItem("test", ID.NewID, Constants.TemplateIds.AtcomRoomTypesGroup);
            db.Add(atcomRoomTypesFolderItem);

            sitecoreContext.ContentDatabase = FakeUtil.FakeDatabase("fakeDB");
            sitecoreContext.ContentDatabase.SelectSingleItem(Arg.Any<string>()).Returns(db.GetItem(atcomRoomTypesFolderItem.ID));

            hybrisService.GetAccommodationRoomTypes().Returns(data);

            repository.GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>()).Returns(roomFolder);
            repository.CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>()).Returns(db.GetItem(roomDbItem.ID));

            searchDatasource.GetItemByCode(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<bool>()).Returns(hotelItem);
            searchDatasource.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(new Dictionary<string, Item>());

            var dataFolder = roomFolder.GetDataFolderQuery();
            databaseProvider.SelectSingleItem($"{dataFolder}/*[@@templateid = '{Constants.TemplateIds.RoomTypesFolder}']/*[@@templateid = '{Constants.TemplateIds.AtcomRoomTypesGroup}']", DatabaseType.Content).Returns(roomFolder);

            // Act
            var actual = syncDataService.SyncAccommodationRoomTypes().FirstOrDefault();

            // Assert
            actual.Should().NotBeNull();
            repository.Received(2).CreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>());
        }

        private void DisableExcludedDataObjectService()
        {
            excludeDataObjectsService.ExceptExcluded(Arg.Any<IEnumerable<DataObject>>()).ReturnsForAnyArgs(i => i[0]);
            excludeDataObjectsService.ExceptExcluded(Arg.Any<IEnumerable<AtcomAccommodationMasterDataObject>>()).ReturnsForAnyArgs(i => i[0]);
            excludeDataObjectsService.IsExcluded(Arg.Any<string>()).Returns(false);
            excludeDataObjectsService.IsExcluded(Arg.Any<Item>()).Returns(false);
        }

        public class DatasourceDbItem : DbItem
        {
            public DatasourceDbItem(string name)
                : base(name)
            {
                Add(Constants.Fields.DatasourceItem.Code, "DatasourceDbItemCode");
                Add(Constants.Fields.DatasourceItem.Name, string.Empty);
                Add(MultisiteConstants.Fields.BaseSetting.SkipTranslate, string.Empty);
            }
        }

        public class AccommodationDbItem : DatasourceDbItem
        {
            public AccommodationDbItem(string name)
                : base(name)
            {
                Add(Constants.Fields.AccommodationItem.GiataCode, string.Empty);
                Add(Constants.Fields.AccommodationItem.Airports, string.Empty);
                Add(Constants.Fields.AccommodationItem.StarRating, string.Empty);
                Add(Constants.Fields.AccommodationItem.City, string.Empty);
                Add(Constants.Fields.AccommodationItem.Address, string.Empty);
                Add(Constants.Fields.AccommodationItem.PostalCode, string.Empty);
                Add(Constants.Fields.AccommodationItem.Email, string.Empty);
                Add(Constants.Fields.AccommodationItem.HotelBedsCode, string.Empty);
                Add(Constants.Fields.AccommodationItem.HotelPhone, string.Empty);
                Add(Constants.Fields.AccommodationItem.Longitude, string.Empty);
                Add(Constants.Fields.AccommodationItem.Latitude, string.Empty);
                Add(Constants.Fields.AccommodationItem.HotelTheme, string.Empty);
                Add(Constants.Fields.AccommodationItem.Types, string.Empty);
            }
        }
    }
}
