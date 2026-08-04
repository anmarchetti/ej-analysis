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
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Resources.Media;
using Sitecore.Shell.Framework.Commands;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunHotelBoardDescriptionImportCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly BaseMediaManager mediaManager;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IBoardTypesRepository boardTypesRepository;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IHotelBoardDescriptionUploadReportService uploadReportService;
        private readonly RunHotelBoardDescriptionImportCommand runHotelBoardDescriptionImportCommand;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunHotelBoardDescriptionImportCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            uploadReportService = Substitute.For<IHotelBoardDescriptionUploadReportService>();
            boardTypesRepository = Substitute.For<IBoardTypesRepository>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            datasourceRepository = new DatasourceRepository(destinationsLogger);
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runHotelBoardDescriptionImportCommand = Substitute.ForPartsOf<RunHotelBoardDescriptionImportCommand>(csvUtilsService, destinationsSearchService, boardTypesRepository, datasourceRepository, uploadReportService, databaseProvider, destinationsLogger, userCreationService, sitecoreUiService);
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
            var actual = runHotelBoardDescriptionImportCommand.IsCommandContextValid(commandContext);

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
            var actual = runHotelBoardDescriptionImportCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            Db.Add(destinationsFolderDbItem);
            runHotelBoardDescriptionImportCommand.GetFileData<HotelBoardDescriptionUpload>(Arg.Any<Item>()).Returns(new List<HotelBoardDescriptionUpload>());

            // Act
            var actual = runHotelBoardDescriptionImportCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<HotelBoardDescriptionUpload> hotelBoardDescriptionUploads, HotelBoardDescriptionUpload accommodationNotInIndex)
        {
            // Arrange
            runHotelBoardDescriptionImportCommand.GetFileData<HotelBoardDescriptionUpload>(Arg.Any<Item>()).Returns(hotelBoardDescriptionUploads);
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDBItem);

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var hotelBoardDescriptionUpload in hotelBoardDescriptionUploads)
            {
                var accommodationDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
                accommodationDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelBoardDescriptionUpload.GiataCode);
                accommodationDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, hotelBoardDescriptionUpload.GiataCode);
                var folderDBItem = new DbItem("Rooms - DC", ID.NewID, Constants.TemplateIds.AccommodationRoomsFolder);
                folderDBItem.Fields.Add(Constants.Fields.DatasourceItem.Code, hotelBoardDescriptionUpload.GiataCode);

                Db.Add(accommodationDbItem);
                folderDBItem.ParentID = accommodationDbItem.ID;
                Db.Add(folderDBItem);

                var accommodationItem = Db.GetItem(accommodationDbItem.ID);

                hits.Add(new BaseHotelSearchResultItem()
                {
                    GiataCode = hotelBoardDescriptionUpload.GiataCode,
                    Uri = accommodationItem.Uri
                });
            }

            hotelBoardDescriptionUploads.Add(accommodationNotInIndex);
            hotelBoardDescriptionUploads.Add(hotelBoardDescriptionUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(hits);

            Db.Add(new DbTemplate(Constants.TemplateIds.AccommodationBoardsFolder));

            var accomodationBoardTemplate = new DbTemplate(Constants.TemplateIds.AccommodationBoard)
            {
                new DbField(Constants.Fields.AccommodationBoardItem.BoardType),
                new DbField(Constants.Fields.AccommodationBoardItem.Content)
            };

            Db.Add(accomodationBoardTemplate);

            var boardTypeTemplate = new DbTemplate(Constants.TemplateIds.BoardType)
            {
                { new DbField(Constants.Fields.DatasourceItem.Code) },
                { new DbField(Constants.Fields.DatasourceItem.Name) }
            };

            Db.Add(boardTypeTemplate);

            var dataFolderDbItem = new DbItem("Data", ID.NewID, Templates.Data.Id);
            var boardTypesFolderDbItem = new DbItem("Board Types Folder", ID.NewID, Constants.TemplateIds.BoardTypesFolder);
            var boardTypeDbItem = new DbItem("Board Type", ID.NewID, Constants.TemplateIds.BoardType);
            boardTypeDbItem.Fields.Add(new DbField(Constants.Fields.DatasourceItem.Code) { Value = hotelBoardDescriptionUploads[1]?.BoardCode });
            boardTypesFolderDbItem.Add(boardTypeDbItem);
            dataFolderDbItem.Add(boardTypesFolderDbItem);

            Db.Add(dataFolderDbItem);

            var boardsHits = new List<SearchHit<BaseDatasourceSearchResultItem>>();
            var boardType = Db.GetItem(boardTypeDbItem.ID);
            boardsHits.Add(new SearchHit<BaseDatasourceSearchResultItem>(1, new BaseDatasourceSearchResultItem()
            {
                Name = hotelBoardDescriptionUploads[1]?.BoardName,
                Code = hotelBoardDescriptionUploads[1]?.BoardCode,
                Uri = boardType.Uri
            }));
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(boardType);

            boardTypesRepository
                .SearchByCodes(Arg.Any<string[]>())
                .Returns(new SearchResults<BaseDatasourceSearchResultItem>(boardsHits, 1));

            var actual = runHotelBoardDescriptionImportCommand.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();

            // Assert
            actual.Count.Should().BeGreaterThan(0);
        }
    }
}
