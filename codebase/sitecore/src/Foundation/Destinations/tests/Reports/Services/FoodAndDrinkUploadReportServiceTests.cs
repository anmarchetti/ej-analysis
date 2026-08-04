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
    public class FoodAndDrinkUploadReportServiceTests
    {
        private readonly IFoodAndDrinkUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IFoodAndDrinkUploadReportService service;

        public FoodAndDrinkUploadReportServiceTests()
        {
            repository = Substitute.For<IFoodAndDrinkUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new FoodAndDrinkUploadReportService(repository, logger);

            repository.Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(FoodAndDrinkRow foodAndDrinkUpload)
        {
            // Act
            service.Warn(foodAndDrinkUpload.HotelCode, foodAndDrinkUpload.HotelName, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<FoodAndDrinkRow> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
