using System;
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
    public class RunRoomNamesUploadCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly ICsvUtilsService csvUtilsService;
        private readonly ISearchDatasourceRepository destinationsRepository;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IRoomNameUploadReportService roomNameUploadService;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;
        private readonly DbItem roomTypesFolder;
        private RunRoomNamesUploadCommand runRoomNamesUploadCommand;

        public RunRoomNamesUploadCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsRepository = Substitute.For<ISearchDatasourceRepository>();
            roomNameUploadService = Substitute.For<IRoomNameUploadReportService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            datasourceRepository = new DatasourceRepository(destinationsLogger);

            roomTypesFolder = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            roomTypesFolder.Name = "Room Types";
            Db.Add(roomTypesFolder);
            userCreationService = Substitute.For<IUserCreationService>();
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "false"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                runRoomNamesUploadCommand = Substitute.ForPartsOf<RunRoomNamesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomNameUploadService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
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

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.RoomNameUpload)
            {
                Type = "FileField",
                Value = roomNamesUploadFileDbItem.ID.ToString()
            };

            destinationsFolerDbItem.Fields.Add(importFileField);

            Db.Add(roomNamesUploadFileDbItem);
            Db.Add(destinationsFolerDbItem);

            var commandContext = new CommandContext(Db.GetItem(destinationsFolerDbItem.ID));

            // Act
            var actual = runRoomNamesUploadCommand.IsCommandContextValid(commandContext);

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
            var actual = runRoomNamesUploadCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            var roomNamesUploadFileDBItem = new DbItem("FakeFile")
            {
                ParentID = ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.RoomNameUpload)
            {
                Type = "FileField",
                Value = roomNamesUploadFileDBItem.ID.ToString()
            };

            destinationsFolderDbItem.Fields.Add(importFileField);

            Db.Add(destinationsFolderDbItem);
            Db.Add(roomNamesUploadFileDBItem);

            // Act
            var actual = runRoomNamesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<RoomNameUpload> roomNameUploads, RoomNameUpload accommodationNotInIndex)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "false"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                runRoomNamesUploadCommand = Substitute.ForPartsOf<RunRoomNamesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomNameUploadService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
            }

            runRoomNamesUploadCommand.GetFileData<RoomNameUpload>(Arg.Any<Item>()).Returns(roomNameUploads);
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDbItem);

            var roomsByCode = new Dictionary<string, Item>();
            foreach (var roomNameUpload in roomNameUploads)
            {
                var folderDbItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomNameUpload.AccomCode);

                Db.Add(folderDbItem);

                roomsByCode[roomNameUpload.AccomCode] = Db.GetItem(folderDbItem.ID);
            }

            destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(roomsByCode);

            roomNameUploads.Add(accommodationNotInIndex);
            roomNameUploads.Add(roomNameUploads.First());

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

            // Act
            var actual = runRoomNamesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(roomsByCode.Count);
            actual.First().Children.First().Languages.Length.Should().Be(1);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldHaveLanguageVersions_IfFileWithDataExists(List<RoomNameUpload> roomNameUploads, RoomNameUpload accommodationNotInIndex)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-DE,fr-FR"))
            {
                runRoomNamesUploadCommand = Substitute.ForPartsOf<RunRoomNamesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomNameUploadService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
            }

            runRoomNamesUploadCommand.GetFileData<RoomNameUpload>(Arg.Any<Item>()).Returns(roomNameUploads);
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDbItem);

            var roomsByCode = new Dictionary<string, Item>();
            foreach (var roomNameUpload in roomNameUploads)
            {
                var folderDbItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomNameUpload.AccomCode);

                Db.Add(folderDbItem);

                roomsByCode[roomNameUpload.AccomCode] = Db.GetItem(folderDbItem.ID);
            }

            destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(roomsByCode);

            roomNameUploads.Add(accommodationNotInIndex);
            roomNameUploads.Add(roomNameUploads.First());

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

            // Act
            var actual = runRoomNamesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(roomsByCode.Count);
            actual.First().Children.First().Languages.Length.Should().Be(3);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldHaveLanguageVersions_IfFileWithDataExists2(List<RoomNameUpload> roomNameUploads, RoomNameUpload accommodationNotInIndex)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", "de-test2,fr-FR"))
            {
                runRoomNamesUploadCommand = Substitute.ForPartsOf<RunRoomNamesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomNameUploadService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
            }

            runRoomNamesUploadCommand.GetFileData<RoomNameUpload>(Arg.Any<Item>()).Returns(roomNameUploads);
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDbItem);

            var roomsByCode = new Dictionary<string, Item>();
            foreach (var roomNameUpload in roomNameUploads)
            {
                var folderDbItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomNameUpload.AccomCode);

                Db.Add(folderDbItem);

                roomsByCode[roomNameUpload.AccomCode] = Db.GetItem(folderDbItem.ID);
            }

            destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(roomsByCode);

            roomNameUploads.Add(accommodationNotInIndex);
            roomNameUploads.Add(roomNameUploads.First());

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

            // Act
            var actual = runRoomNamesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(roomsByCode.Count);
            actual.First().Children.First().Languages.Length.Should().Be(2);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldNotHaveLanguageVersions_IfLanguageSettingsAreEmpty(List<RoomNameUpload> roomNameUploads, RoomNameUpload accommodationNotInIndex)
        {
            // Arrange
            using (new SettingsSwitcher("Destinations.AtcomRoomTypesFolderPath", Db.GetItem(roomTypesFolder.ID).Paths.FullPath))
            using (new SettingsSwitcher("Destinations.AddLanguageVersionForRooms", "true"))
            using (new SettingsSwitcher("Destinations.RequiredRoomLanguages", string.Empty))
            {
                runRoomNamesUploadCommand = Substitute.ForPartsOf<RunRoomNamesUploadCommand>(csvUtilsService, destinationsRepository, datasourceRepository, roomNameUploadService, destinationsLogger, databaseProvider, userCreationService, sitecoreUiService);
            }

            runRoomNamesUploadCommand.GetFileData<RoomNameUpload>(Arg.Any<Item>()).Returns(roomNameUploads);
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDbItem);

            var roomsByCode = new Dictionary<string, Item>();
            foreach (var roomNameUpload in roomNameUploads)
            {
                var folderDbItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, roomNameUpload.AccomCode);

                Db.Add(folderDbItem);

                roomsByCode[roomNameUpload.AccomCode] = Db.GetItem(folderDbItem.ID);
            }

            destinationsRepository.GetItemsByCodes(Arg.Any<List<string>>(), Arg.Any<ID>()).Returns(roomsByCode);

            roomNameUploads.Add(accommodationNotInIndex);
            roomNameUploads.Add(roomNameUploads.First());

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

            // Act
            var actual = runRoomNamesUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID)).ToList();

            // Assert
            actual.Count.Should().Be(roomsByCode.Count);
            actual.First().Children.First().Languages.Length.Should().Be(1);
        }
    }
}
