using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Mvc;
using AutoFixture.Xunit2;
using easyJet.Foundation.HotelBeds.Controllers;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Sites;
using Xunit;

namespace easyJet.Foundation.HotelBeds.Tests.Controllers
{
    public class FacilityTypesControllerTests
    {
        private readonly FacilityTypesController controller;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IHotelBedsLogger logger;
        private readonly IFacilityTypesService service;

        public FacilityTypesControllerTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            service = Substitute.For<IFacilityTypesService>();
            logger = Substitute.For<IHotelBedsLogger>();
            controller = new FacilityTypesController(csvUtilsService, service, logger);
        }

        [Theory]
        [AutoData]
        public void ExportFacilitiesTypes_ShouldExportFacilitiesTypes_IfFacilitiesTypesExist(Db db, FacilityReportRow facilityReportRow)
        {
            // Arrange
            var dataDbItem = new DbItem("Data", ID.NewID, Multisite.Templates.Data.Id);
            db.Add(dataDbItem);

            var fakeSiteContext = new FakeSiteContext(
               new Sitecore.Collections.StringDictionary
               {
                    { "name", "fake" },
                    { "database", "master" },
                    { "rootPath", "/sitecore/content" }
               });

            var rows = new CsvUtilsService().WriteToCsv(new FacilityReportRow[] { facilityReportRow });
            csvUtilsService.WriteToCsv(Arg.Any<IEnumerable<FacilityReportRow>>()).Returns(rows);

            service.ExportFacilityTypes(db.GetItem(dataDbItem.ID)).Returns(new FacilityReportRow[]
            {
                facilityReportRow
            });
            using (new FakeSiteContextSwitcher(fakeSiteContext))
            {
                // Act
                var act = (controller.ExportFacilities(dataDbItem.ID.ToString(), "en", "master") as FileContentResult)?.FileContents;
                using (var stram = new MemoryStream(act))
                {
                    var result = new CsvUtilsService().ReadFromCsv<FacilityReportRow>(stram, 1);
                    // Assert
                    result.Should().HaveCount(1);
                    result.First().FacilityCode.Should().Be(facilityReportRow.FacilityCode);
                    result.First().FacilityGroup.Should().Be(facilityReportRow.FacilityGroup);
                    result.First().FacilityName.Should().Be(facilityReportRow.FacilityName);
                    result.First().FacilityVirualGroup.Should().Be(facilityReportRow.FacilityVirualGroup);
                }
            }
        }
    }
}
