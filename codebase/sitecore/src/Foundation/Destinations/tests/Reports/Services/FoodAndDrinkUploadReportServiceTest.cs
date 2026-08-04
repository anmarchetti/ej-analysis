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
    public class FoodAndDrinkUploadReportServiceTest
    {
        private readonly IFoodAndDrinkUploadReportRepository repository;
        private readonly IFoodAndDrinkUploadReportService service;
        private readonly IDestinationsLogger logger;

        public FoodAndDrinkUploadReportServiceTest()
        {
            repository = Substitute.For<IFoodAndDrinkUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new FoodAndDrinkUploadReportService(repository, logger);
            repository.Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(FoodAndDrinkRow foodAndDrinkRow)
        {
            // Act
            service.Warn(foodAndDrinkRow.HotelCode, foodAndDrinkRow.HotelName, "a test message");

            // Assert
            repository.Received().Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemsExist(IEnumerable<FoodAndDrinkRow> foodAndDrinkRowItems)
        {
            // Act
            service.Warn(foodAndDrinkRowItems, "a test message");

            // Assert
            repository.Received().Add(Arg.Any<FacilityTabUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}