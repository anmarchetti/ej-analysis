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
    public class RoomNameUploadReportServiceTests
    {
        private readonly IRoomNameUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IRoomNameUploadReportService service;

        public RoomNameUploadReportServiceTests()
        {
            repository = Substitute.For<IRoomNameUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new RoomNameUploadReportService(repository, logger);

            repository.Add(Arg.Any<RoomNameUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(RoomNameUpload failedUploadDataItem)
        {
            // Act
            service.Warn(failedUploadDataItem.AccomCode, failedUploadDataItem.RoomCode, failedUploadDataItem.RoomName, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<RoomNameUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemsExist(IEnumerable<RoomNameUpload> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<RoomNameUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
