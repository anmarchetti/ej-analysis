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
    public class HotelThemesUploadReportServiceTests
    {
        private readonly IHotelsThemesUploadReportRepository repository;
        private readonly IDestinationsLogger logger;
        private readonly IHotelThemesUploadReportService service;

        public HotelThemesUploadReportServiceTests()
        {
            repository = Substitute.For<IHotelsThemesUploadReportRepository>();
            logger = Substitute.For<IDestinationsLogger>();
            service = new HotelThemesUploadReportService(repository, logger);

            repository.Add(Arg.Any<HotelThemesUploadRecord>());
            logger.Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWarnMethods_IfFailedToUploadItemExist(HotelWithThemeRow failedUploadDataItem)
        {
            // Act
            service.Warn(failedUploadDataItem.HotelCode, failedUploadDataItem.HotelName, failedUploadDataItem.HotelThemeName, failedUploadDataItem.HotelThemeCode, failedUploadDataItem.HotelTypeName, failedUploadDataItem.HotelTypeCode, "fake message");

            // Assert
            repository.Received().Add(Arg.Any<HotelThemesUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Warn_ShouldCallAddAndWardMethods_IfFailedToUploadItemsExist(IEnumerable<HotelWithThemeRow> failedUploadDataItems, string message)
        {
            // Act
            service.Warn(failedUploadDataItems, message);

            // Assert
            repository.Received().Add(Arg.Any<HotelThemesUploadRecord>());
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}
