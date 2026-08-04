using System.Collections.Generic;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunRoomFacilitiesUploadCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly ICsvUtilsService csvUtilsService;
        private readonly ISearchDatasourceRepository destinationsRepository;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IRoomFacilityUploadReportService roomFacilityUploadReportService;
        private readonly RunRoomFacilitiesUploadCommand sut;
        private readonly IDatabaseProvider databaseProvider;
        private readonly DbItem roomTypesFolder;
        private readonly DbItem dcFacilityTypesFolder;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunRoomFacilitiesUploadCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsRepository = Substitute.For<ISearchDatasourceRepository>();
            roomFacilityUploadReportService = Substitute.For<IRoomFacilityUploadReportService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            datasourceRepository = new DatasourceRepository(destinationsLogger);
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();

            roomTypesFolder = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            roomTypesFolder.Name = "Room Types";
            Db.Add(roomTypesFolder);

            dcFacilityTypesFolder = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            dcFacilityTypesFolder.Name = "DC Facilities";
            Db.Add(dcFacilityTypesFolder);

            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.DCFacilityTypesFolderPath", Db.GetItem(dcFacilityTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "false"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                sut = Substitute.ForPartsOf<RunRoomFacilitiesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomFacilityUploadReportService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
            }
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_FileTypeIsNotValid()
        {
            // Arrange
            var destinationsFolerDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationsFolerDbItem.TemplateID = Constants.TemplateIds.DestinationsFolder;

            var roomNamesUploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.RoomFacilityUpload)
            {
                Type = "FileField",
                Value = roomNamesUploadFileDbItem.ID.ToString()
            };

            destinationsFolerDbItem.Fields.Add(importFileField);

            Db.Add(roomNamesUploadFileDbItem);
            Db.Add(destinationsFolerDbItem);

            var commandContext = new CommandContext(Db.GetItem(destinationsFolerDbItem.ID));

            // Act
            var actual = sut.IsCommandContextValid(commandContext);

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
            var actual = sut.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDbItem);

            sut.GetFileData<RoomFacilityUpload>(Arg.Any<Item>()).Returns(new List<RoomFacilityUpload>());

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<RoomFacilityUpload> roomFacilityUploads, RoomFacilityUpload accommodationNotInIndex)
        {
            // Arrange
            sut.GetFileData<RoomFacilityUpload>(Arg.Any<Item>()).Returns(roomFacilityUploads);

            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDBItem);

            var results = new Dictionary<string, Item>();
            foreach (var roomFacilityUpload in roomFacilityUploads)
            {
                var folderDBItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDBItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomFacilityUpload.AccomCode);

                Db.Add(folderDBItem);

                results[roomFacilityUpload.AccomCode] = Db.GetItem(folderDBItem.ID);
            }

            roomFacilityUploads.Add(accommodationNotInIndex);
            roomFacilityUploads.Add(roomFacilityUploads.First());

            destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(results);

            var roomTemplate = new DbTemplate(Constants.TemplateIds.AccommodationRoom)
            {
                { new DbField(Constants.Fields.DatasourceItem.Name) },
                { new DbField(Constants.Fields.AccommodationRoomItem.RoomType) }
            };

            Db.Add(roomTemplate);

            var roomTypeTemplate = new DbTemplate(Constants.TemplateIds.RoomType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(roomTypeTemplate);

            var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(facilityTypeTemplate);

            var roomFacilityTemplate = new DbTemplate(Constants.TemplateIds.RoomFacility)
            {
                { new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType) },
                { new DbField(Constants.Fields.StandardFields.SortOrder) }
            };

            Db.Add(roomFacilityTemplate);
            Db.Add(new DbTemplate(Constants.TemplateIds.RoomFacilitiesFolder));

            // Act
            var actual = sut.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count().Should().BeGreaterThan(0);
            actual.First(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder).Children.First().Languages.Length.Should().Be(1);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldAddLanguageVersion_IfSettingsAreCorrect(List<RoomFacilityUpload> roomFacilityUploads, RoomFacilityUpload accommodationNotInIndex)
        {
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.DCFacilityTypesFolderPath", Db.GetItem(dcFacilityTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                var runRoomFacilitiesUploadCommand = Substitute.ForPartsOf<RunRoomFacilitiesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomFacilityUploadReportService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);

                // Arrange
                runRoomFacilitiesUploadCommand.GetFileData<RoomFacilityUpload>(Arg.Any<Item>()).Returns(roomFacilityUploads);

                var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                Db.Add(destinationsFolderDBItem);

                var results = new Dictionary<string, Item>();
                foreach (var roomFacilityUpload in roomFacilityUploads)
                {
                    var folderDBItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                    folderDBItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomFacilityUpload.AccomCode);

                    Db.Add(folderDBItem);

                    results[roomFacilityUpload.AccomCode] = Db.GetItem(folderDBItem.ID);
                }

                roomFacilityUploads.Add(accommodationNotInIndex);
                roomFacilityUploads.Add(roomFacilityUploads.First());

                destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(results);

                var roomTemplate = new DbTemplate(Constants.TemplateIds.AccommodationRoom)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Name) },
                    { new DbField(Constants.Fields.AccommodationRoomItem.RoomType) }
                };

                Db.Add(roomTemplate);

                var roomTypeTemplate = new DbTemplate(Constants.TemplateIds.RoomType)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Code) },
                    { new DbField(Constants.Fields.DatasourceItem.Name) }
                };

                Db.Add(roomTypeTemplate);

                var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Code) },
                    { new DbField(Constants.Fields.DatasourceItem.Name) }
                };

                Db.Add(facilityTypeTemplate);

                var roomFacilityTemplate = new DbTemplate(Constants.TemplateIds.RoomFacility)
                {
                    { new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType) },
                    { new DbField(Constants.Fields.StandardFields.SortOrder) }
                };

                Db.Add(roomFacilityTemplate);
                Db.Add(new DbTemplate(Constants.TemplateIds.RoomFacilitiesFolder));

                // Act
                var actual = runRoomFacilitiesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

                // Assert
                actual.Count().Should().BeGreaterThan(0);
                actual.First(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder).Children.First().Languages.Length.Should().Be(3);
            }
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldAddLanguageVersion_IfSettingsAreCorrect2(List<RoomFacilityUpload> roomFacilityUploads, RoomFacilityUpload accommodationNotInIndex)
        {
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.DCFacilityTypesFolderPath", Db.GetItem(dcFacilityTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "en-test2,fr-FR"))
            {
                var runRoomFacilitiesUploadCommand = Substitute.ForPartsOf<RunRoomFacilitiesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomFacilityUploadReportService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);

                // Arrange
                runRoomFacilitiesUploadCommand.GetFileData<RoomFacilityUpload>(Arg.Any<Item>()).Returns(roomFacilityUploads);

                var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                Db.Add(destinationsFolderDBItem);

                var results = new Dictionary<string, Item>();
                foreach (var roomFacilityUpload in roomFacilityUploads)
                {
                    var folderDBItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                    folderDBItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomFacilityUpload.AccomCode);

                    Db.Add(folderDBItem);

                    results[roomFacilityUpload.AccomCode] = Db.GetItem(folderDBItem.ID);
                }

                roomFacilityUploads.Add(accommodationNotInIndex);
                roomFacilityUploads.Add(roomFacilityUploads.First());

                destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(results);

                var roomTemplate = new DbTemplate(Constants.TemplateIds.AccommodationRoom)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Name) },
                    { new DbField(Constants.Fields.AccommodationRoomItem.RoomType) }
                };

                Db.Add(roomTemplate);

                var roomTypeTemplate = new DbTemplate(Constants.TemplateIds.RoomType)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Code) },
                    { new DbField(Constants.Fields.DatasourceItem.Name) }
                };

                Db.Add(roomTypeTemplate);

                var facilityTypeTemplate = new DbTemplate(Constants.TemplateIds.FacilityType)
                {
                    { new DbField(Constants.Fields.DatasourceItem.Code) },
                    { new DbField(Constants.Fields.DatasourceItem.Name) }
                };

                Db.Add(facilityTypeTemplate);

                var roomFacilityTemplate = new DbTemplate(Constants.TemplateIds.RoomFacility)
                {
                    { new DbField(Constants.Fields.AccommodationFacilityItem.FacilityType) },
                    { new DbField(Constants.Fields.StandardFields.SortOrder) }
                };

                Db.Add(roomFacilityTemplate);
                Db.Add(new DbTemplate(Constants.TemplateIds.RoomFacilitiesFolder));

                // Act
                var actual = runRoomFacilitiesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

                // Assert
                actual.Count().Should().BeGreaterThan(0);
                actual.First(x => x.TemplateID == Constants.TemplateIds.AccommodationRoomsFolder).Children.First().Languages.Length.Should().Be(2);
            }
        }
    }
}
