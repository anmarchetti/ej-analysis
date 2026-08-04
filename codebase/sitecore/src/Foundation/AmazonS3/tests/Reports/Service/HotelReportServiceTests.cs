using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Models;
using easyJet.Foundation.AmazonS3.Reports.Repositories;
using easyJet.Foundation.AmazonS3.Reports.Service;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Reports.Service
{
    public class HotelReportServiceTests
    {
        private readonly IHotelImageReportRepository hotelImageReportRepository;
        private readonly IAmazonS3Logger amazonS3Logger;
        private readonly HotelReportService hotelReportService;

        public HotelReportServiceTests()
        {
            hotelImageReportRepository = Substitute.For<IHotelImageReportRepository>();
            amazonS3Logger = Substitute.For<IAmazonS3Logger>();
            hotelReportService = new HotelReportService(hotelImageReportRepository, amazonS3Logger);
        }

        [Theory]
        [AutoData]
        public void HotelReportsService_CallError_IfHotelImageSatusEqualError(string atcomCode, string imageName, string message)
        {
            // Arrange
            HotelImageStatusRecord hotelImageStatusRecord = new HotelImageStatusRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = atcomCode,
                ImageName = imageName,
                Message = message,
                Status = Status.Error
            };
            // Act
            hotelReportService.Error(atcomCode, imageName, message);
            // Assert
            hotelImageReportRepository.ReceivedWithAnyArgs().Add(hotelImageStatusRecord);
        }

        [Theory]
        [AutoData]
        public void HotelReportsService_CallWarn_IfHotelImageSatusEqualWarn(string atcomCode, string imageName, string message)
        {
            // Arrange
            HotelImageStatusRecord hotelImageStatusRecord = new HotelImageStatusRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = atcomCode,
                ImageName = imageName,
                Message = message,
                Status = Status.Warn
            };
            // Act
            hotelReportService.Warn(atcomCode, imageName, message);
            // Assert
            hotelImageReportRepository.ReceivedWithAnyArgs().Add(hotelImageStatusRecord);
        }

        [Theory]
        [AutoData]
        public void HotelReportsService_CallSuccess_IfHotelImageSatusEqualSuccess(string atcomCode, string imageName, string message)
        {
            // Arrange
            HotelImageStatusRecord hotelImageStatusRecord = new HotelImageStatusRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = atcomCode,
                ImageName = imageName,
                Message = message,
                Status = Status.Success
            };
            // Act
            hotelReportService.Success(atcomCode, imageName, message);
            // Assert
            hotelImageReportRepository.ReceivedWithAnyArgs().Add(hotelImageStatusRecord);
        }

        [Theory]
        [AutoData]
        public void HotelReportsService_CallDeleted_IfHotelImageSatusEqualDeleted(string atcomCode, string imageName, string message)
        {
            // Arrange
            HotelImageStatusRecord hotelImageStatusRecord = new HotelImageStatusRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = atcomCode,
                ImageName = imageName,
                Message = message,
                Status = Status.Deleted
            };
            // Act
            hotelReportService.Deleted(atcomCode, imageName, message);
            // Assert
            hotelImageReportRepository.ReceivedWithAnyArgs().Add(hotelImageStatusRecord);
        }
    }
}
