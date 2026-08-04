using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Services;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class RunFoodAndDrinkImportCommandTests
    {
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IFoodAndDrinkUploadReportService foodAndDrinkUploadReportService;
        private readonly IDestinationsLogger logger;
        private readonly RunFoodAndDrinkImportCommand runFoodAndDrinkImportCommand;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;

        public RunFoodAndDrinkImportCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            logger = Substitute.For<IDestinationsLogger>();
            foodAndDrinkUploadReportService = Substitute.For<IFoodAndDrinkUploadReportService>();
            destinationsSearchService = Substitute.For<IDestinationsSearchService>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            runFoodAndDrinkImportCommand = Substitute.ForPartsOf<RunFoodAndDrinkImportCommand>(
                csvUtilsService,
                destinationsSearchService,
                datasourceRepository,
                foodAndDrinkUploadReportService,
                databaseProvider,
                logger,
                userCreationService,
                sitecoreUiService);
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldBeEmpty_IfThereNoData(Db db)
        {
            // Arrange
            var destinationsDbItem = new DbItem("Destinations", ID.NewID, Constants.TemplateIds.DestinationsFolder);
            destinationsDbItem.Fields.Add(Constants.Fields.DestinationsFolder.FoodAndDrinkHotelFacilityUpload, string.Empty);
            db.Add(destinationsDbItem);

            runFoodAndDrinkImportCommand.GetFileData<FoodAndDrinkRow>(Arg.Any<Item>()).Returns(new List<FoodAndDrinkRow>());

            var searchResults = new BaseDestinationsSearchResultItem[0];

            destinationsSearchService
                .GetDestinationsByCodes(Arg.Any<string[]>(), Arg.Any<bool>())
                .Returns(searchResults);

            // Act
            var act = runFoodAndDrinkImportCommand.ProcessItems(db.GetItem(destinationsDbItem.ID));

            // Assert
            act.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void SynchronizeItems_ShouldUpdateMuzementIds_IfDestinationsExist(Db db, List<FoodAndDrinkRow> foodAndDrinkRows)
        {
            // Arrange
            var expected = foodAndDrinkRows.First();

            var destinationsDbItem = new DbItem("Destinations", ID.NewID, Constants.TemplateIds.DestinationsFolder);
            destinationsDbItem.Fields.Add(Constants.Fields.DestinationsFolder.FoodAndDrinkHotelFacilityUpload, string.Empty);
            db.Add(destinationsDbItem);

            var hotelDbItem = new DbItem(expected.HotelName, ID.NewID, Constants.TemplateIds.Accommodation);
            hotelDbItem.Fields.Add(Constants.Fields.DatasourceItem.Code, expected.HotelCode);
            var foodAndDrinkDescription = new DbItem("Food And Drink", ID.NewID, Constants.TemplateIds.FoodAndDrinkFacilityRichTextTab);
            foodAndDrinkDescription.Fields.Add(Constants.Fields.FacilityRichTextTab.Description, string.Empty);
            hotelDbItem.Add(foodAndDrinkDescription);
            db.Add(hotelDbItem);

            runFoodAndDrinkImportCommand.GetFileData<FoodAndDrinkRow>(Arg.Any<Item>()).Returns(foodAndDrinkRows);
            var hotelItem = db.GetItem(hotelDbItem.ID);
            var searchResults = new BaseHotelSearchResultItem[]
                {
                    new BaseHotelSearchResultItem
                    {
                        ItemName = hotelItem.Name,
                        Code = expected.HotelCode,
                        TemplateId = Constants.TemplateIds.Accommodation,
                        Uri = hotelItem.Uri,
                        GiataCode = expected.HotelCode
                    }
                };

            databaseProvider.GetItem(Arg.Any<ItemUri>()).ReturnsForAnyArgs(hotelItem);

            datasourceRepository
                .GetOrCreateItem(Arg.Any<string>(), Arg.Any<ID>(), Arg.Any<Item>(), Arg.Any<bool>())
                .Returns(db.GetItem(foodAndDrinkDescription.ID));

            destinationsSearchService
                .GetHotelsByGiataCodes(Arg.Any<string[]>())
                .Returns(searchResults);

            // Act
            var act = runFoodAndDrinkImportCommand.ProcessItems(db.GetItem(destinationsDbItem.ID));

            // Assert
            act.Should().HaveCount(1);
            act.ElementAt(0).Children.ElementAt(0).TemplateID.Should().Be(Constants.TemplateIds.FoodAndDrinkFacilityRichTextTab);
            act.ElementAt(0).Children.ElementAt(0).Fields[Constants.Fields.FacilityRichTextTab.Description].Value.Should().Be(expected.Description);
        }
    }
}
