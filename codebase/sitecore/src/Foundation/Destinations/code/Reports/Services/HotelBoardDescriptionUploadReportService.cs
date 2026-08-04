using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    [Service(typeof(IHotelBoardDescriptionUploadReportService), Lifetime = Lifetime.Singleton)]
    public class HotelBoardDescriptionUploadReportService : BaseUploadReportService<HotelBoardDescriptionUpload, HotelBoardDescriptionUploadRecord>, IHotelBoardDescriptionUploadReportService
    {
        public HotelBoardDescriptionUploadReportService(IHotelBoardDescriptionsUploadReportRepository repository, IDestinationsLogger logger)
             : base(repository, logger)
        {
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<HotelBoardDescriptionUpload> hotelBoardDescriptionsUploads, string message)
        {
            AddRecords(hotelBoardDescriptionsUploads, message);
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string hotelName, string boardCode, string boardName, string message)
        {
            AddRecord(new HotelBoardDescriptionUpload(hotelCode, hotelName, boardCode, boardName), message);
        }

        /// <inheritdoc />
        protected override HotelBoardDescriptionUploadRecord BuildReportRecord(HotelBoardDescriptionUpload modelData, string message)
        {
            return new HotelBoardDescriptionUploadRecord()
            {
                HotelCode = modelData.GiataCode,
                HotelName = modelData.HotelName,
                BoardCode = modelData.BoardCode,
                BoardName = modelData.BoardName,
                DateTime = DateTime.UtcNow,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(HotelBoardDescriptionUpload modelData, string message)
        {
            return $"Hotel {modelData.HotelName} with {modelData.GiataCode} failed to upload hotel board description for board {modelData.BoardName} with code {modelData.BoardCode}. Reason: {message}.";
        }
    }
}