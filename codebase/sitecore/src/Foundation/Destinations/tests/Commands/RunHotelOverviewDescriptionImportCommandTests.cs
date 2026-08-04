using System.Collections.Generic;
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
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.SecurityModel;
using Sitecore.Shell.Framework.Commands;
using Xunit;
using static easyJet.Foundation.Destinations.Constants.Fields;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunHotelOverviewDescriptionImportCommandTests
    {
        protected Fixture Fixture { get; private set; }

        protected Db Db { get; private set; }

        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly IHotelOverviewDescriptionUploadReportService uploadReportService;
        private readonly RunHotelOverviewDescriptionUploadCommand runHotelOverviewDescriptionUploadCommand;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunHotelOverviewDescriptionImportCommandTests()
        {
            Fixture = new Fixture();
            Db = Fixture.Freeze<Db>();

            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            uploadReportService = Substitute.For<IHotelOverviewDescriptionUploadReportService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            runHotelOverviewDescriptionUploadCommand = Substitute.ForPartsOf<RunHotelOverviewDescriptionUploadCommand>(csvUtilsService, destinationsLogger, destinationsSearchService, databaseProvider, uploadReportService, userCreationService, sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_FileTypeIsNotValid()
        {
            // Arrange
            var destinationsFolerDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            destinationsFolerDbItem.TemplateID = Constants.TemplateIds.DestinationsFolder;

            var uploadFileDbItem = new DbItem("FakeFile")
            {
                ParentID = Sitecore.ItemIDs.MediaLibraryRoot
            };

            var importFileField = new DbField(Constants.Fields.DestinationsFolder.HotelOverviewDescriptionUpload)
            {
                Type = "FileField",
                Value = uploadFileDbItem.ID.ToString()
            };

            destinationsFolerDbItem.Fields.Add(importFileField);

            Db.Add(uploadFileDbItem);
            Db.Add(destinationsFolerDbItem);

            var commandContext = new CommandContext(Db.GetItem(destinationsFolerDbItem.ID));

            // Act
            var actual = runHotelOverviewDescriptionUploadCommand.IsCommandContextValid(commandContext);

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
            var actual = runHotelOverviewDescriptionUploadCommand.IsCommandContextValid(commandContext);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void SynchronizeItem_ShouldNotReturnItems_IfFileWithDataNotExists()
        {
            // Arrange
            var destinationsFolderDbItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();

            Db.Add(destinationsFolderDbItem);
            runHotelOverviewDescriptionUploadCommand.GetFileData<HotelOverviewDescriptionUpload>(Arg.Any<Item>()).Returns(new List<HotelOverviewDescriptionUpload>());

            // Act
            var actual = runHotelOverviewDescriptionUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDbItem.ID));

            // Assert
            actual.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItem_ShouldReturnItems_IfFileWithDataExists(List<HotelOverviewDescriptionUpload> hotelOverviewDescriptionUploads, HotelOverviewDescriptionUpload accommodationNotInIndex)
        {
            // Arrange
            runHotelOverviewDescriptionUploadCommand.GetFileData<HotelOverviewDescriptionUpload>(Arg.Any<Item>()).Returns(hotelOverviewDescriptionUploads);
            var destinationsFolderDBItem = Fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            Db.Add(destinationsFolderDBItem);

            var hits = new List<BaseHotelSearchResultItem>();

            foreach (var hotelBoardDescriptionUpload in hotelOverviewDescriptionUploads)
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
                databaseProvider.GetItem(accommodationItem.Uri).Returns(accommodationItem);
                hits.Add(new BaseHotelSearchResultItem()
                {
                    GiataCode = hotelBoardDescriptionUpload.GiataCode,
                    Uri = accommodationItem.Uri
                });
            }

            hotelOverviewDescriptionUploads.Add(accommodationNotInIndex);
            hotelOverviewDescriptionUploads.Add(hotelOverviewDescriptionUploads.First());

            destinationsSearchService.GetHotelsByGiataCodes(Arg.Any<string[]>()).ReturnsForAnyArgs(hits);

            using (new SecurityDisabler())
            {
                var actual = runHotelOverviewDescriptionUploadCommand.ProcessItems(Db.GetItem(destinationsFolderDBItem.ID)).ToList();
                actual.Count.Should().BeGreaterThan(0);
                // Assert
            }
        }
    }
}
