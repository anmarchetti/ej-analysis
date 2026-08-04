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
    public class HotelBoardDescriptionUploadReportServiceTests
    {
        private readonly IHotelBoardDescriptionsUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IHotelBoardDescriptionUploadReportService service;

        public HotelBoardDescriptionUploadReportServiceTests()
        {
            repository = Substitute.For<IHotelBoardDescriptionsUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new HotelBoardDescriptionUploadReportService(repository, logger);

            repository.Add(Arg.Any<HotelBoardDescriptionUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(HotelBoardDescriptionUpload hotelBoardDescriptionUpload)
        {
            // Act
            service.Warn(hotelBoardDescriptionUpload.GiataCode, hotelBoardDescriptionUpload.HotelName, hotelBoardDescriptionUpload.BoardCode, hotelBoardDescriptionUpload.BoardName, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<HotelBoardDescriptionUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<HotelBoardDescriptionUpload> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<HotelBoardDescriptionUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
