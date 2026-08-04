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
    public class HotelOverviewDescriptionUploadReportServiceTests
    {
        private readonly IHotelOverviewDescriptionsUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IHotelOverviewDescriptionUploadReportService service;

        public HotelOverviewDescriptionUploadReportServiceTests()
        {
            repository = Substitute.For<IHotelOverviewDescriptionsUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new HotelOverviewDescriptionUploadReportService(repository, logger);

            repository.Add(Arg.Any<HotelOverviewDescriptionUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(HotelOverviewDescriptionUpload hotelBoardDescriptionUpload)
        {
            // Act
            service.Warn(hotelBoardDescriptionUpload.GiataCode, hotelBoardDescriptionUpload.HotelOverviewDescription, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<HotelOverviewDescriptionUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<HotelOverviewDescriptionUpload> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<HotelOverviewDescriptionUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
