using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunFacilitiesUploadCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IFacilityUploadReportService uploadReportService;
        private readonly ISearchDatasourceRepository searchDatasourceRepository;
        private readonly RunHotelFacilityImportCommandProxy sut;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunFacilitiesUploadCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            mediaManager = Substitute.For<BaseMediaManager>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            uploadReportService = Substitute.For<IFacilityUploadReportService>();
            searchDatasourceRepository = Substitute.For<ISearchDatasourceRepository>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            datasourceRepository = new DatasourceRepository(destinationsLogger);
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            sut = new RunHotelFacilityImportCommandProxy(mediaManager, csvUtilsService, destinationsSearchService, datasourceRepository, uploadReportService, databaseProvider, destinationsLogger, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_FileTypeIsNotValid()
        {
            // Arrange
            var destinationsFolerDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationsFolerDbItem.TemplateID = Constants.TemplateIds.DestinationsFolder;

            var facilitiesUploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = facilitiesUploadFileDbItem.ID.ToString()
            };

            destinationsFolerDbItem.Fields.Add(importFileField);

            Db.Add(facilitiesUploadFileDbItem);
            Db.Add(destinationsFolerDbItem);

            var commandContext = new CommandContext(Db.GetItem(destinationsFolerDbItem.ID));

            // Act
            var actual = sut.IsCommandContextValidProxy(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTemplateIsNotValid()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationsFolderDbItem.TemplateID = Constants.TemplateIds.Accommodation;
            Db.Add(destinationsFolderDbItem);

            var commandContext = new CommandContext(Db.GetItem(destinationsFolderDbItem.ID));

            // Act
            var actual = sut.IsCommandContextValidProxy(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = facilityUploadFileDBItem.ID.ToString()
            };

            destinationsFolderDbItem.Fields.Add(importFileField);

            Db.Add(destinationsFolderDbItem);
            Db.Add(facilityUploadFileDBItem);

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<FacilityUpload> facilityUploads, FacilityUpload accommodationNotInIndex)
        {
            // Arrange
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            csvUtilsService.ReadFromCsv<FacilityUpload>(Arg.Any<Stream>()).ReturnsForAnyArgs(facilityUploads);

            var facilityUploadFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{facilityUploadFileDBItem.ID.ToString()}\" />"
            };

            destinationsFolderDBItem.Fields.Add(facilityUploadFileField);

            Db.Add(destinationsFolderDBItem);
            Db.Add(facilityUploadFileDBItem);

            var mediaItem = new MediaItem(Db.GetItem(destinationsFolderDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var facilityUpload in facilityUploads)
            {
                var accommodationDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                accommodationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityUpload.HotelCode);
                accommodationDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, facilityUpload.HotelCode);

                Db.Add(accommodationDbItem);

                var accommodationItem = Db.GetItem(accommodationDbItem.ID);
                databaseProvider.GetItem(accommodationItem.Uri).Returns(accommodationItem);
                hits.Add(new BaseHotelSearchResultItem()
                {
                    Uri = accommodationItem.Uri
                });
            }

            facilityUploads.Add(accommodationNotInIndex);
            facilityUploads.Add(facilityUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(hits);

            Db.Add(new DbTemplate(Constants.TemplateIds.AccommodationFacilitiesFolder));

            var accomodationFacilityTemplate = new DbTemplate(Constants.TemplateIds.AccommodationFacility)
            {
                new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType)
            };

            Db.Add(accomodationFacilityTemplate);

            var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(facilityTypeTemplate);

            var dataFolderDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var facilitiesTypesFolderDbItem = new DbItem("Facilities Types Folder", ID.NewID, Constants.TemplateIds.FacilityTypesFolder);
            var facilitiesTypesGroupDbItem = new DbItem(facilityUploads[1]?.FacilityGroup, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            var facilityTypeDbItem = new DbItem("Facility Type", ID.NewID, Constants.TemplateIds.FacilityType);
            facilityTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = facilityUploads[1]?.FacilityCode });
            facilitiesTypesGroupDbItem.Add(facilityTypeDbItem);
            facilitiesTypesFolderDbItem.Add(facilitiesTypesGroupDbItem);
            dataFolderDbItem.Add(facilitiesTypesFolderDbItem);

            Db.Add(dataFolderDbItem);

            var itemByCodes = new Dictionary<string, Item>();
            itemByCodes.Add(facilityUploads[1]?.FacilityCode, Db.GetItem(facilityTypeDbItem.ID));
            searchDatasourceRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(itemByCodes);

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count.Should().BeGreaterThan(0);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldNotReturnItems_IfNoHotelsAreFound(List<FacilityUpload> facilityUploads, FacilityUpload accommodationNotInIndex)
        {
            // Arrange
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            csvUtilsService.ReadFromCsv<FacilityUpload>(Arg.Any<Stream>()).ReturnsForAnyArgs(facilityUploads);

            var facilityUploadFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{facilityUploadFileDBItem.ID.ToString()}\" />"
            };

            destinationsFolderDBItem.Fields.Add(facilityUploadFileField);

            Db.Add(destinationsFolderDBItem);
            Db.Add(facilityUploadFileDBItem);

            var mediaItem = new MediaItem(Db.GetItem(destinationsFolderDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var facilityUpload in facilityUploads)
            {
                var accommodationDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                accommodationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityUpload.HotelCode);
                accommodationDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, facilityUpload.HotelCode);

                Db.Add(accommodationDbItem);

                var accommodationItem = Db.GetItem(accommodationDbItem.ID);
                databaseProvider.GetItem(accommodationItem.Uri).Returns(accommodationItem);
                hits.Add(new BaseHotelSearchResultItem()
                {
                    Uri = accommodationItem.Uri
                });
            }

            facilityUploads.Add(accommodationNotInIndex);
            facilityUploads.Add(facilityUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(new List<BaseHotelSearchResultItem>());

            Db.Add(new DbTemplate(Constants.TemplateIds.AccommodationFacilitiesFolder));

            var accomodationFacilityTemplate = new DbTemplate(Constants.TemplateIds.AccommodationFacility)
            {
                new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType)
            };

            Db.Add(accomodationFacilityTemplate);

            var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(facilityTypeTemplate);

            var dataFolderDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var facilitiesTypesFolderDbItem = new DbItem("Facilities Types Folder", ID.NewID, Constants.TemplateIds.FacilityTypesFolder);
            var facilitiesTypesGroupDbItem = new DbItem(facilityUploads[1]?.FacilityGroup, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            var facilityTypeDbItem = new DbItem("Facility Type", ID.NewID, Constants.TemplateIds.FacilityType);
            facilityTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = facilityUploads[1]?.FacilityCode });
            facilitiesTypesGroupDbItem.Add(facilityTypeDbItem);
            facilitiesTypesFolderDbItem.Add(facilitiesTypesGroupDbItem);
            dataFolderDbItem.Add(facilitiesTypesFolderDbItem);

            Db.Add(dataFolderDbItem);

            var itemByCodes = new Dictionary<string, Item>();
            itemByCodes.Add(facilityUploads[1]?.FacilityCode, Db.GetItem(facilityTypeDbItem.ID));
            searchDatasourceRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(itemByCodes);

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(0);
            uploadReportService.Received().Warn(Arg.Any<IList<FacilityUpload>>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldNotReturnItems_IfException(List<FacilityUpload> facilityUploads, FacilityUpload accommodationNotInIndex)
        {
            // Arrange
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            csvUtilsService.ReadFromCsv<FacilityUpload>(Arg.Any<Stream>()).ReturnsForAnyArgs(facilityUploads);

            var facilityUploadFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{facilityUploadFileDBItem.ID.ToString()}\" />"
            };

            destinationsFolderDBItem.Fields.Add(facilityUploadFileField);

            Db.Add(destinationsFolderDBItem);
            Db.Add(facilityUploadFileDBItem);

            var mediaItem = new MediaItem(Db.GetItem(destinationsFolderDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var facilityUpload in facilityUploads)
            {
                var accommodationDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                accommodationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityUpload.HotelCode);
                accommodationDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, facilityUpload.HotelCode);

                Db.Add(accommodationDbItem);

                var accommodationItem = Db.GetItem(accommodationDbItem.ID);
                databaseProvider.GetItem(accommodationItem.Uri).Returns(accommodationItem);
                hits.Add(new BaseHotelSearchResultItem()
                {
                    Uri = accommodationItem.Uri
                });
            }

            facilityUploads.Add(accommodationNotInIndex);
            facilityUploads.Add(facilityUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ThrowsForAnyArgs(new Exception());

            Db.Add(new DbTemplate(Constants.TemplateIds.AccommodationFacilitiesFolder));

            var accomodationFacilityTemplate = new DbTemplate(Constants.TemplateIds.AccommodationFacility)
            {
                new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType)
            };

            Db.Add(accomodationFacilityTemplate);

            var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(facilityTypeTemplate);

            var dataFolderDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var facilitiesTypesFolderDbItem = new DbItem("Facilities Types Folder", ID.NewID, Constants.TemplateIds.FacilityTypesFolder);
            var facilitiesTypesGroupDbItem = new DbItem(facilityUploads[1]?.FacilityGroup, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            var facilityTypeDbItem = new DbItem("Facility Type", ID.NewID, Constants.TemplateIds.FacilityType);
            facilityTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = facilityUploads[1]?.FacilityCode });
            facilitiesTypesGroupDbItem.Add(facilityTypeDbItem);
            facilitiesTypesFolderDbItem.Add(facilitiesTypesGroupDbItem);
            dataFolderDbItem.Add(facilitiesTypesFolderDbItem);

            Db.Add(dataFolderDbItem);

            var itemByCodes = new Dictionary<string, Item>();
            itemByCodes.Add(facilityUploads[1]?.FacilityCode, Db.GetItem(facilityTypeDbItem.ID));
            searchDatasourceRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(itemByCodes);

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(0);
            destinationsLogger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            uploadReportService.Received().Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldNotReturnItems_IfException2(List<FacilityUpload> facilityUploads, FacilityUpload accommodationNotInIndex)
        {
            // Arrange
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var facilityUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            csvUtilsService.ReadFromCsv<FacilityUpload>(Arg.Any<Stream>()).ReturnsForAnyArgs(facilityUploads);

            var facilityUploadFileField = new DbField(Constants.Fields.DestinationsFolder.FacilityUpload)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{facilityUploadFileDBItem.ID.ToString()}\" />"
            };

            destinationsFolderDBItem.Fields.Add(facilityUploadFileField);

            Db.Add(destinationsFolderDBItem);
            Db.Add(facilityUploadFileDBItem);

            var mediaItem = new MediaItem(Db.GetItem(destinationsFolderDBItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var facilityUpload in facilityUploads)
            {
                var accommodationDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                accommodationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, facilityUpload.HotelCode);
                accommodationDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, facilityUpload.HotelCode);

                Db.Add(accommodationDbItem);

                var accommodationItem = Db.GetItem(accommodationDbItem.ID);
                databaseProvider.GetItem(accommodationItem.Uri).Returns(accommodationItem);
                hits.Add(new BaseHotelSearchResultItem()
                {
                    Uri = accommodationItem.Uri
                });
            }

            facilityUploads.Add(accommodationNotInIndex);
            facilityUploads.Add(facilityUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(hits);

            Db.Add(new DbTemplate(Constants.TemplateIds.AccommodationFacilitiesFolder));

            var accomodationFacilityTemplate = new DbTemplate(Constants.TemplateIds.AccommodationFacility)
            {
                new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType)
            };

            Db.Add(accomodationFacilityTemplate);

            var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(facilityTypeTemplate);

            var dataFolderDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var facilitiesTypesFolderDbItem = new DbItem("Facilities Types Folder", ID.NewID, Constants.TemplateIds.FacilityTypesFolder);
            var facilitiesTypesGroupDbItem = new DbItem(facilityUploads[1]?.FacilityGroup, ID.NewID, Constants.TemplateIds.FacilityTypesGroup);
            var facilityTypeDbItem = new DbItem("Facility Type", ID.NewID, Constants.TemplateIds.FacilityType);
            facilityTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = string.Empty });
            facilitiesTypesGroupDbItem.Add(facilityTypeDbItem);
            facilitiesTypesFolderDbItem.Add(facilitiesTypesGroupDbItem);
            dataFolderDbItem.Add(facilitiesTypesFolderDbItem);
            Db.Add(dataFolderDbItem);

            var itemByCodes = new Dictionary<string, Item>();
            searchDatasourceRepository
                .GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>())
                .Returns(itemByCodes);
            uploadReportService.When(s => s.Warn(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Constants.ReportErrors.FacilityNotFound)).Do(call => { throw new Exception(); });

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(0);
            destinationsLogger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void PostAction_ShouldShowAlert()
        {
            // Arrange
            var args = new ClientPipelineArgs();

            // Act
            sut.PostActionProxy(args);

            // Assert
            sitecoreUiService.Received(1).ClientResponse_Alert(Arg.Is("Facilities were uploaded successfully."));
            sitecoreUiService.Received(1).ClientPage_SendMessage(Arg.Any<object>(), Arg.Any<string>());
        }

        [Fact]
        public void PostAction_ShouldShowError()
        {
            // Arrange
            var args = new ClientPipelineArgs();
            sut.ForceSetFieldValue("hasErrorsDuringUpload", true);

            // Act
            sut.PostActionProxy(args);

            // Assert
            sitecoreUiService.Received(1).ClientResponse_ShowError(Arg.Is("Error is thrown during uploading facilities, please contact to administrator."), Arg.Is(string.Empty));
            sitecoreUiService.Received(1).ClientPage_SendMessage(Arg.Any<object>(), Arg.Any<string>());
        }

        private class RunHotelFacilityImportCommandProxy : RunHotelFacilityImportCommand
        {
            public RunHotelFacilityImportCommandProxy(
                BaseMediaManager mediaManager,
                ICsvUtilsService csvUtilsService,
                IDestinationsSearchService destinationsSearchService,
                IDatasourceRepository datasourceRepository,
                IFacilityUploadReportService facilityUploadReportService,
                IDatabaseProvider databaseProvider,
                IDestinationsLogger logger,
                IUserCreationService userCreationService,
                ISitecoreUIService sitecoreUiService)
                : base(mediaManager, csvUtilsService, destinationsSearchService, datasourceRepository, facilityUploadReportService, databaseProvider, logger, userCreationService, sitecoreUiService)
            {
            }

            public bool IsCommandContextValidProxy(CommandContext context) => IsCommandContextValid(context);

            public void PostActionProxy(ClientPipelineArgs args) => PostAction(args);
        }
    }
}
