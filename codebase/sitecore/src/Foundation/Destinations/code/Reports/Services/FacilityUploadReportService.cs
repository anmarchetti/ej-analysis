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
    [Service(typeof(IFacilityUploadReportService), Lifetime = Lifetime.Singleton)]
    public class FacilityUploadReportService : BaseUploadReportService<FacilityUpload, FacilityUploadRecord>, IFacilityUploadReportService
    {
        public FacilityUploadReportService(IFacilityUploadReportRepository repository, IDestinationsLogger logger)
             : base(repository, logger)
        {
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<FacilityUpload> facilityUploads, string message)
        {
            AddRecords(facilityUploads, message);
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string facilityCode, string facilityName, string facilityGroup, string hotelName, string facilityFilterGroup, string message)
        {
            AddRecord(new FacilityUpload(hotelCode, facilityCode, facilityName, facilityGroup, hotelName, facilityFilterGroup), message);
        }

        /// <inheritdoc />
        protected override FacilityUploadRecord BuildReportRecord(FacilityUpload modelData, string message)
        {
            return new FacilityUploadRecord()
            {
                HotelCode = modelData.HotelCode,
                DateTime = DateTime.UtcNow,
                FacilityCode = modelData.FacilityCode,
                FacilityName = modelData.FacilityName,
                HotelName = modelData.HotelName,
                FacilityFilterGroup = modelData.FacilityFilterGroup,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(FacilityUpload modelData, string message)
        {
            return $"Hotel {modelData.HotelName} with {modelData.HotelCode} failed to upload facility {modelData.FacilityName} with code {modelData.FacilityCode}. Reason: {message}.";
        }
    }
}