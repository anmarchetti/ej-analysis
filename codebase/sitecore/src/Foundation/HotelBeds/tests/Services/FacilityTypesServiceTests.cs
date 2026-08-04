using System.Collections.Generic;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.HotelBeds.Tests.FakeDb;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;
using IMasterDataService = easyJet.Foundation.HotelBeds.Services.IMasterDataService;

namespace easyJet.Foundation.HotelBeds.Tests.Services
{
    public class FacilityTypesServiceTests
    {
        private readonly FacilityTypesService service;
        private readonly IMasterDataService masterDataService;
        private readonly IVirtualFacilityGroupingService virtualFacilityGroupingService;

        public FacilityTypesServiceTests()
        {
            masterDataService = Substitute.For<IMasterDataService>();
            virtualFacilityGroupingService = Substitute.For<IVirtualFacilityGroupingService>();
            service = new FacilityTypesService(virtualFacilityGroupingService, masterDataService);
        }

        [Theory]
        [AutoData]
        public void ExportFacilitiesTypes_ShouldExportFacilitiesTypes_IfFacilitiesTypesExist(Db db, FacilityReportRow[] facilityReportRows)
        {
            // Arrange
            var dataDbItem = new DbItem("Data", ID.NewID, Multisite.Templates.Data.Id);
            var facilitiesFolderDbItem = new FacilityTypesFolderDbItem("Facilities");

            for (int i = 0; i < facilityReportRows.Length; i++)
            {
                var facilityReportRow = facilityReportRows[i];

                var facilitiesTypesGroupDbItem = new FacilityTypesGroupDbItem($"Facility Group {i}", facilityReportRow.FacilityGroup);
                var facilityTypeDbItem = new FacilityTypeDbItem($"Facility type {i}", facilityReportRow.FacilityCode);
                facilitiesTypesGroupDbItem.Add(facilityTypeDbItem);
                facilitiesFolderDbItem.Add(facilitiesTypesGroupDbItem);
            }

            dataDbItem.Add(facilitiesFolderDbItem);
            db.Add(dataDbItem);

            masterDataService.GetFacilities().Returns(new HotelBeds.Models.Domain.Facility[]
            {
                new HotelBeds.Models.Domain.Facility()
                {
                    Code = facilityReportRows.First().FacilityCode
                }
            });

            // Act
            var act = service.ExportFacilityTypes(db.GetItem(dataDbItem.ID)).ToArray();

            // Assert
            for (int i = 0; i < facilityReportRows.Length; i++)
            {
                act[i].FacilityCode.Should().Be(facilityReportRows[i].FacilityCode);
            }
        }
    }
}
