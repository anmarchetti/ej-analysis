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
    [Service(typeof(IFamilyFacilityUploadReportService), Lifetime = Lifetime.Singleton)]
    public class FamilyFacilityUploadReportService : BaseUploadReportService<FamilyFacilityTabRow, FacilityTabUploadRecord>, IFamilyFacilityUploadReportService
    {
        public FamilyFacilityUploadReportService(IFamilyFacilityTabUploadRepository reportRepository, IDestinationsLogger logger)
            : base(reportRepository, logger)
        {
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string hotelName, string message)
        {
            AddRecord(new FamilyFacilityTabRow { GiataCode = hotelCode, HotelName = hotelName }, message);
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<FamilyFacilityTabRow> foodAndDrinkUploadRecords, string message)
        {
            AddRecords(foodAndDrinkUploadRecords, message);
        }

        /// <inheritdoc />
        protected override FacilityTabUploadRecord BuildReportRecord(FamilyFacilityTabRow modelData, string message)
        {
            return new FacilityTabUploadRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = modelData.GiataCode,
                HotelName = modelData.HotelName,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(FamilyFacilityTabRow modelData, string message)
        {
            return $"Family Facility tab for hotel {modelData.HotelName} with code {modelData.GiataCode} failed to upload. Reason: {message}.";
        }
    }
}
