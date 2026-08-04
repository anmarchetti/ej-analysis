using System.Collections.Generic;
using System.IO;
using System.Linq;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Abstractions;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunUploadHotelsToPromoPageCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsLogger logger;
        private readonly RunUploadHotelsToPromoPageCommand runUploadHotelsToPromoPageCommand;

        public RunUploadHotelsToPromoPageCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            mediaManager = Substitute.For<BaseMediaManager>();
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            logger = Substitute.For<IDestinationsLogger>();

            runUploadHotelsToPromoPageCommand = new RunUploadHotelsToPromoPageCommand(mediaManager, csvUtilsService, destinationsSearchService, logger);
        }

        [Fact]
        public void QueryState_ShouldBeHidden_FileTypeIsNotValid()
        {
            // Arrange
            var promoPageDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            promoPageDBItem.TemplateID = Constants.TemplateIds.PromoPage;

            var importFileField = new DbField(Constants.Fields.PromoPage.HotelsImportData)
            {
                Type = "FileField",
                Value = new ID().ToString()
            };

            promoPageDBItem.Fields.Add(importFileField);

            Db.Add(promoPageDBItem);

            var commandContext = new CommandContext(Db.GetItem(promoPageDBItem.ID));

            // Act
            var actual = runUploadHotelsToPromoPageCommand.QueryState(commandContext);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void QueryState_ShouldBeHidden_IfTemplateIsNotValid()
        {
            // Arrange
            var promoPageDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            promoPageDBItem.TemplateID = Constants.TemplateIds.Accommodation;
            Db.Add(promoPageDBItem);

            var commandContext = new CommandContext(Db.GetItem(promoPageDBItem.ID));

            // Act
            var actual = runUploadHotelsToPromoPageCommand.QueryState(commandContext);

            // Assert
            actual.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void Execute_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var promoPageItem = new DbItem("PromoPage");

            var hotelsImportFileItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.PromoPage.HotelsImportData)
            {
                Type = "FileField",
                Value = hotelsImportFileItem.ID.ToString()
            };

            promoPageItem.Fields.Add(importFileField);
            promoPageItem.Fields.Add(Constants.Fields.PromoPage.Destination);

            Db.Add(promoPageItem);
            Db.Add(hotelsImportFileItem);

            var commandContext = new CommandContext(Db.GetItem(promoPageItem.ID));

            // Act
            runUploadHotelsToPromoPageCommand.Execute(commandContext);

            // Assert
            commandContext.Items.FirstOrDefault().Fields[Constants.Fields.PromoPage.Destination].Value.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void Execute_ShouldChangePromoPageDestinationField_IfHotelIdNotInDestinationField(List<DestinationReportRow> hotelsImportData, ID destinationId, ID hotelId)
        {
            // Arrange
            var hotelImportRowWithoutCodes = new DestinationReportRow();

            hotelsImportData.Add(hotelImportRowWithoutCodes);

            var promoPageItem = new DbItem("PromoPage");

            var hotelsImportFileItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var mimeTypeField = new DbField("Mime Type")
            {
                Value = "text/csv"
            };

            hotelsImportFileItem.Fields.Add(mimeTypeField);

            csvUtilsService.ReadFromCsv<DestinationReportRow>(Arg.Any<Stream>()).ReturnsForAnyArgs(hotelsImportData);

            var hotelsImportDataFileField = new DbField(Constants.Fields.PromoPage.HotelsImportData)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{hotelsImportFileItem.ID}\" />"
            };

            var promoPageDestinationField = new DbField(Constants.Fields.PromoPage.Destination)
            {
                Type = "TreeListEx",
                Value = destinationId.ToString()
            };

            promoPageItem.Fields.Add(hotelsImportDataFileField);
            promoPageItem.Fields.Add(promoPageDestinationField);

            Db.Add(promoPageItem);
            Db.Add(hotelsImportFileItem);

            var mediaItem = new MediaItem(Db.GetItem(hotelsImportFileItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var results = hotelsImportData.Select(x => new BaseDestinationsSearchResultItem()
            {
                SourceCodes = new[] { x.HotelCode },
                GiataCode = x.GiataCode,
                Name = x.HotelName,
                ItemId = ID.NewID,
            }).ToList();

            var expectedResult = string.Join("|", results.Select(x => x.ItemId));

            destinationsSearchService.GetDestinationsByCodes(Arg.Any<string[]>(), false).ReturnsForAnyArgs(results);

            var commandContext = new CommandContext(Db.GetItem(promoPageItem.ID));

            // Act
            runUploadHotelsToPromoPageCommand.Execute(commandContext);
            var actual = Db.GetItem(promoPageItem.ID).Fields[Constants.Fields.PromoPage.Destination].Value;

            // Assert
            actual.Should().NotBeNullOrWhiteSpace();
            actual.Should().Be(expectedResult);
        }

        [Theory]
        [AutoData]
        public void Execute_ShouldNotChangeDestinationsField_IfNoHotelsWereFound(List<DestinationReportRow> hotelsImportData, ID destinationId)
        {
            // Arrange
            var hotelImportRowWithoutCodes = new DestinationReportRow();

            hotelsImportData.Add(hotelImportRowWithoutCodes);

            var promoPageItem = new DbItem("PromoPage");

            var hotelsImportFileItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var mimeTypeField = new DbField("Mime Type")
            {
                Value = "text/csv"
            };

            hotelsImportFileItem.Fields.Add(mimeTypeField);

            csvUtilsService.ReadFromCsv<DestinationReportRow>(Arg.Any<Stream>()).ReturnsForAnyArgs(hotelsImportData);

            var hotelsImportDataFileField = new DbField(Constants.Fields.PromoPage.HotelsImportData)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{hotelsImportFileItem.ID}\" />"
            };

            var promoPageDestinationField = new DbField(Constants.Fields.PromoPage.Destination)
            {
                Type = "TreeListEx",
                Value = destinationId.ToString()
            };

            promoPageItem.Fields.Add(hotelsImportDataFileField);
            promoPageItem.Fields.Add(promoPageDestinationField);

            Db.Add(promoPageItem);
            Db.Add(hotelsImportFileItem);

            var mediaItem = new MediaItem(Db.GetItem(hotelsImportFileItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var results = new List<BaseDestinationsSearchResultItem>();
            destinationsSearchService.GetDestinationsByCodes(Arg.Any<string[]>(), false).ReturnsForAnyArgs(results);

            var commandContext = new CommandContext(Db.GetItem(promoPageItem.ID));

            // Act
            runUploadHotelsToPromoPageCommand.Execute(commandContext);

            // Assert
            commandContext.Items.FirstOrDefault().Fields[Constants.Fields.PromoPage.Destination].Value.Should().Be(destinationId.ToString());
        }

        [Theory]
        [AutoData]
        public void Execute_ShouldNotChangeDestinationsField_IfCsvFileIsEmpty(List<DestinationReportRow> hotelsImportData, ID destinationId)
        {
            // Arrange
            var hotelImportRowWithoutCodes = new DestinationReportRow();

            hotelsImportData.Add(hotelImportRowWithoutCodes);

            var promoPageItem = new DbItem("PromoPage");

            var hotelsImportFileItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var mimeTypeField = new DbField("Mime Type")
            {
                Value = "text/csv"
            };

            hotelsImportFileItem.Fields.Add(mimeTypeField);

            csvUtilsService.ReadFromCsv<DestinationReportRow>(Arg.Any<Stream>()).ReturnsNullForAnyArgs();

            var hotelsImportDataFileField = new DbField(Constants.Fields.PromoPage.HotelsImportData)
            {
                Type = "FileField",
                Value = $"<link linktype=\"media\" mediaid=\"{hotelsImportFileItem.ID}\" />"
            };

            var promoPageDestinationField = new DbField(Constants.Fields.PromoPage.Destination)
            {
                Type = "TreeListEx",
                Value = destinationId.ToString()
            };

            promoPageItem.Fields.Add(hotelsImportDataFileField);
            promoPageItem.Fields.Add(promoPageDestinationField);

            Db.Add(promoPageItem);
            Db.Add(hotelsImportFileItem);

            var mediaItem = new MediaItem(Db.GetItem(hotelsImportFileItem.ID));

            using (var memoryStream = new MemoryStream())
            {
                byte[] fakeText = System.Text.Encoding.UTF8.GetBytes("fakeText");
                memoryStream.Write(fakeText, 0, fakeText.Length);

                var mediaStream = new MediaStream(memoryStream, "csv", mediaItem);
                mediaManager.GetMedia(Arg.Any<MediaItem>()).GetStream().ReturnsForAnyArgs(mediaStream);
            }

            var commandContext = new CommandContext(Db.GetItem(promoPageItem.ID));

            // Act
            runUploadHotelsToPromoPageCommand.Execute(commandContext);

            // Assert
            commandContext.Items.FirstOrDefault().Fields[Constants.Fields.PromoPage.Destination].Value.Should().Be(destinationId.ToString());
        }
    }
}
