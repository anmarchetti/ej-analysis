using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Controllers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Controllers
{
    public class DestinationsControllerTests
    {
        private readonly DestinationsController controller;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsLogger logger;
        private readonly IHotelThemesService hotelThemesService;

        public DestinationsControllerTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            hotelThemesService = Substitute.For<IHotelThemesService>();
            logger = Substitute.For<IDestinationsLogger>();
            controller = new DestinationsController(csvUtilsService, hotelThemesService, logger);
        }

        [Theory]
        [AutoData]
        public void ExportPromoDestinations_ShouldExportPromoDestinations_IfPromoDestinationsExist(Db db, ID itemId, DestinationReportRow destinationReportRow)
        {
            // Arrange
            var dbItem = new DbItem("Item", itemId);
            var destinationDbItem = new DestinationDbItem(
                "Destination",
                destinationReportRow.HotelCode,
                destinationReportRow.GiataCode);
            dbItem.Fields.Add(new DbField(Constants.Fields.PromoPage.Destination) { Value = destinationDbItem.ID.ToString() });
            db.Add(dbItem);
            db.Add(destinationDbItem);

            var fakeSiteContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });
            var rows = new CsvUtilsService().WriteToCsv(new DestinationReportRow[] { destinationReportRow });
            csvUtilsService.WriteToCsv(Arg.Any<IEnumerable<DestinationReportRow>>()).Returns(rows);

            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var act = (controller.ExportPromoDestinations(itemId.ToString(), "en", "master") as FileContentResult)?.FileContents;
                using (var stram = new MemoryStream(act))
                {
                    var result = new CsvUtilsService().ReadFromCsv<DestinationReportRow>(stram, 1);
                    // Assert
                    result.Should().HaveCount(1);
                    result.First().GiataCode.Should().Be(destinationReportRow.GiataCode);
                    result.First().HotelCode.Should().Be(destinationReportRow.HotelCode);
                    result.First().HotelName.Should().Be(destinationReportRow.HotelName);
                }
            }
        }
    }
}
