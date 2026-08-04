using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Models.Responses;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunHotelThemesTypesUploadCommandTests
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IHotelThemesUploadReportService hotelThemesUploadReportService;
        private readonly IHotelThemesService hotelThemesService;
        private readonly IDestinationsLogger destinationsLogger;
        private readonly RunHotelThemesTypesUploadCommand runHotelThemesTypesUploadCommand;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunHotelThemesTypesUploadCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            destinationsLogger = Substitute.For<IDestinationsLogger>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            hotelThemesUploadReportService = Substitute.For<IHotelThemesUploadReportService>();
            hotelThemesService = Substitute.For<IHotelThemesService>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runHotelThemesTypesUploadCommand = Substitute.ForPartsOf<RunHotelThemesTypesUploadCommand>(csvUtilsService, destinationsSearchService, hotelThemesUploadReportService, hotelThemesService, databaseProvider, destinationsLogger, userCreationService, sitecoreUiService);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldBeEmpty_IfThereNoData(Db db)
        {
            // Arrange
            var destinationsDbItem = new DbItem("Destinations", ID.NewID, Constants.TemplateIds.DestinationsFolder);
            destinationsDbItem.Fields.Add(Constants.Fields.DestinationsFolder.ThemesTypesUpload, string.Empty);
            db.Add(destinationsDbItem);

            runHotelThemesTypesUploadCommand.GetFileData<HotelWithThemeRow>(Arg.Any<Item>()).Returns(new List<HotelWithThemeRow>());

            var searchResults = new BaseDestinationsSearchResultItem[0];

            destinationsSearchService
                .GetDestinationsByCodes(Arg.Any<string[]>(), Arg.Any<bool>())
                .Returns(new List<BaseDestinationsSearchResultItem>(searchResults));

            // Act
            var act = runHotelThemesTypesUploadCommand.ProcessItems(db.GetItem(destinationsDbItem.ID));

            // Assert
            act.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldUpdateMuzementIds_IfDestinationsExist(Db db, List<HotelWithThemeRow> hotelWithThemeRows)
        {
            // Arrange
            var expectedHotel = hotelWithThemeRows.First();

            var themes = new List<HotelThemeResponseItem>()
            {
                new HotelThemeResponseItem()
                {
                    Id = ID.NewID,
                    Code = expectedHotel.HotelThemeCode,
                    Types = new List<Type>()
                    {
                        new Type()
                        {
                            Id = ID.NewID,
                            Code = expectedHotel.HotelTypeCode
                        }
                    }
                }
            };
            hotelThemesService.GetHotelThemes().Returns(themes);

            var destinationsDbItem = new DbItem("Destinations", ID.NewID, Constants.TemplateIds.DestinationsFolder);
            destinationsDbItem.Fields.Add(Constants.Fields.DestinationsFolder.ThemesTypesUpload, string.Empty);
            db.Add(destinationsDbItem);

            var hotelThemeDbItem = new DbItem(expectedHotel.HotelThemeName, ID.NewID, Constants.TemplateIds.HotelTheme);
            hotelThemeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, expectedHotel.HotelThemeCode);
            hotelThemeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, expectedHotel.HotelThemeName);
            db.Add(hotelThemeDbItem);

            var themeTypelDbItem = new DbItem(expectedHotel.HotelTypeCode, ID.NewID, Constants.TemplateIds.ThemeType);
            hotelThemeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, expectedHotel.HotelTypeCode);
            hotelThemeDbItem.Fields.Add(Constants.Fields.DatasourceItem.Name, expectedHotel.HotelTypeName);
            db.Add(themeTypelDbItem);

            var hotelDbItem = new DbItem(expectedHotel.HotelName, ID.NewID, Constants.TemplateIds.RegionPage);
            hotelDbItem.Fields.Add(Constants.Fields.AccommodationItem.HotelTheme, hotelThemeDbItem.ID.ToString());
            hotelDbItem.Fields.Add(Constants.Fields.AccommodationItem.Types, themeTypelDbItem.ToString());
            hotelDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, expectedHotel.HotelCode);
            hotelDbItem.Fields.Add(Constants.Fields.AccommodationItem.GiataCode, expectedHotel.HotelCode);
            db.Add(hotelDbItem);

            runHotelThemesTypesUploadCommand.GetFileData<HotelWithThemeRow>(Arg.Any<Item>()).Returns(hotelWithThemeRows);

            var hotelItem = db.GetItem(hotelDbItem.ID);
            var searchResults = new BaseHotelSearchResultItem[]
                {
                    new BaseHotelSearchResultItem()
                    {
                        ItemName = hotelDbItem.Name,
                        Code = expectedHotel.HotelCode,
                        GiataCode = expectedHotel.HotelCode,
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Uri = hotelItem.Uri
                    }
                };

            destinationsSearchService
                .GetHotelsByGiataCodes(Arg.Any<string[]>())
                .Returns(new List<BaseHotelSearchResultItem>(searchResults));
            databaseProvider.GetItem(Arg.Any<ItemUri>()).Returns(hotelItem);
            // Act
            var act = runHotelThemesTypesUploadCommand.ProcessItems(db.GetItem(destinationsDbItem.ID));

            // Assert
            act.Should().HaveCount(1);
        }
    }
}
