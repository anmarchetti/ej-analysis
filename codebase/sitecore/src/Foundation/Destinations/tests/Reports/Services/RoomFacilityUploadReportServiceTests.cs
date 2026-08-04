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
    public class RoomFacilityUploadReportServiceTests
    {
        private readonly IRoomFacilityUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IRoomFacilityUploadReportService service;

        public RoomFacilityUploadReportServiceTests()
        {
            repository = Substitute.For<IRoomFacilityUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new RoomFacilityUploadReportService(repository, logger);

            repository.Add(Arg.Any<RoomFacilityUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(RoomFacilityUpload failedUploadDataItem)
        {
            // Act
            service.Warn(failedUploadDataItem.AccomCode, failedUploadDataItem.RoomCode, failedUploadDataItem.RoomName, failedUploadDataItem.Code, failedUploadDataItem.Name, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<RoomFacilityUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<RoomFacilityUpload> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<RoomFacilityUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
