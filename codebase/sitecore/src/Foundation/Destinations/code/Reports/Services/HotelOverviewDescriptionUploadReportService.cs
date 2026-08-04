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
    [Service(typeof(IHotelOverviewDescriptionUploadReportService), Lifetime = Lifetime.Singleton)]
    public class HotelOverviewDescriptionUploadReportService : BaseUploadReportService<HotelOverviewDescriptionUpload, HotelOverviewDescriptionUploadRecord>, IHotelOverviewDescriptionUploadReportService
    {
        public HotelOverviewDescriptionUploadReportService(IHotelOverviewDescriptionsUploadReportRepository reportRepository, IDestinationsLogger logger)
            : base(reportRepository, logger)
        {
        }

        public void Warn(string hotelCode, string hotelOverviewDescription, string message)
        {
            AddRecord(new HotelOverviewDescriptionUpload(hotelCode, hotelOverviewDescription), message);
        }

        public void Warn(IEnumerable<HotelOverviewDescriptionUpload> hotelOverviewDescriptionsUploads, string message)
        {
            AddRecords(hotelOverviewDescriptionsUploads, message);
        }

        protected override HotelOverviewDescriptionUploadRecord BuildReportRecord(HotelOverviewDescriptionUpload modelData, string message)
        {
            return new HotelOverviewDescriptionUploadRecord
            {
                DateTime = DateTime.UtcNow,
                GiataCode = modelData.GiataCode,
                HotelOverviewDescription = modelData.HotelOverviewDescription,
                Message = message
            };
        }

        protected override string BuildLogRecord(HotelOverviewDescriptionUpload modelData, string message)
        {
            return $"Hotel with {modelData.GiataCode} failed to upload hotel overview description. Reason: {message}.";
        }
    }
}