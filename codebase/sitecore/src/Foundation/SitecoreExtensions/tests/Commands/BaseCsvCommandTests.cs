using System.Collections.Generic;
using System.IO;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Logger;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyjet.Foundation.Testing.Attributes;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Commands
{
    public class BaseCsvCommandTests
    {
        private static readonly ID TemplateId = new ID("{41831D30-A4BD-4AD0-B5F2-A3D0A6F7828A}");
        private static readonly ID FileFieldId = new ID("{CF76DE30-2248-4C06-A065-EB4B76A9623D}");

        private readonly BaseCsvCommand command;
        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly ILogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public BaseCsvCommandTests()
        {
            logger = Substitute.For<ILogger>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            mediaManager = Substitute.For<BaseMediaManager>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = Substitute.ForPartsOf<BaseCsvCommand>(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService);
        }

        [Theory]
        [AutoDbData]
        public void IsCommandContextValid_ShouldBeFalse_IfSettingsIsNotValid(Item item)
        {
            // Arrange
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValid(context);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void IsCommandContextValid_ShouldBeFalse_IfItemTemplateIsNotValid(Item item)
        {
            // Arrange
            CommandManager.RegisterCommand("fake:resynchotelfacilities", command);
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValid(context);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void IsCommandContextValid_ShouldBeFalse_FileTypeIsNotValid(Db db)
        {
            // Arrange
            var folderDbItem = new DbItem("Upload folder", ID.NewID, TemplateId);

            var uploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(FileFieldId)
            {
                Type = "FileField",
                Value = uploadFileDbItem.ID.ToString()
            };

            folderDbItem.Fields.Add(importFileField);

            db.Add(folderDbItem);
            db.Add(uploadFileDbItem);

            var commandContext = new CommandContext(db.GetItem(folderDbItem.ID));

            // Act
            var actual = command.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoDbData]
        public void GetFileData_ShouldBeEmptyFileModel_IfSettingsIsNotValid(Item item)
        {
            // Act
            var actual = command.GetFileData<FakeFileModel>(item);

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void GetFileData_ShouldBeEmpty_IfFileFieldHasNoFile(Db db)
        {
            // Arrange
            CommandManager.RegisterCommand("fake:resynchotelfacilities", command);
            var folderDbItem = new DbItem("Upload folder", ID.NewID, TemplateId);

            var uploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var facilityUploadFileField = new DbField(FileFieldId)
            {
                Type = "FileField",
                Value = string.Empty
            };

            folderDbItem.Fields.Add(facilityUploadFileField);

            db.Add(folderDbItem);
            db.Add(uploadFileDbItem);

            // Act
            var actual = command.GetFileData<FakeFileModel>(db.GetItem(folderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoDbData]
        public void GetFileData_ShouldReturnFileModel_IfFileFieldHasFile(Db db, List<FakeFileModel> fileModel)
        {
            // Arrange
            CommandManager.RegisterCommand("fake:resynchotelfacilities", command);
            var folderDbItem = new DbItem("Upload folder", ID.NewID, TemplateId);

            var uploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            csvUtilsService.ReadFromCsv<FakeFileModel>(Arg.Any<Stream>(), Arg.Any<FileParameters>()).ReturnsForAnyArgs(fileModel);

            var facilityUploadFileField = new DbField(FileFieldId)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{uploadFileDbItem.ID}\" />"
            };

            folderDbItem.Fields.Add(facilityUploadFileField);

            db.Add(folderDbItem);
            db.Add(uploadFileDbItem);

            var mediaItem = new MediaItem(db.GetItem(uploadFileDbItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            // Act
            var actual = command.GetFileData<FakeFileModel>(db.GetItem(folderDbItem.ID));

            // Assert
            actual[0].Code.Should().Be(fileModel[0].Code);
            actual[0].Name.Should().Be(fileModel[0].Name);
        }
    }
}
