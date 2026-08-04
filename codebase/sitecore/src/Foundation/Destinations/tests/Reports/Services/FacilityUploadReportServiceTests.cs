using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Repositories;
using easyJet.Foundation.Destinations.Reports.Services;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Reports.Services
{
    public class FacilityUploadReportServiceTests
    {
        private readonly IFacilityUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IFacilityUploadReportService service;

        public FacilityUploadReportServiceTests()
        {
            repository = Substitute.For<IFacilityUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new FacilityUploadReportService(repository, logger);

            repository.Add(Arg.Any<FacilityUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(FacilityUpload facilityUpload)
        {
            // Act
            service.Warn(facilityUpload.HotelCode, facilityUpload.FacilityCode, facilityUpload.FacilityName, facilityUpload.FacilityGroup, facilityUpload.HotelName, facilityUpload.FacilityFilterGroup, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<FacilityUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<FacilityUpload> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<FacilityUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
