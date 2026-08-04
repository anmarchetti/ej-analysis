using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.HotelBeds.Logging;
using easyJet.Foundation.HotelBeds.Models.Domain;
using easyJet.Foundation.HotelBeds.Reports.Models;
using easyJet.Foundation.HotelBeds.Reports.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.HotelBeds.Reports.Services
{
    [Service(typeof(IResyncFaciltitesReportService), Lifetime = Lifetime.Singleton)]
    public class ResyncFaciltitesReportService : BaseUploadReportService<HotelFacilitesResyncRow, ResyncFaciltitesRecord>, IResyncFaciltitesReportService
    {
        public ResyncFaciltitesReportService(IReSyncFacilitiesReportRepository repository, IHotelBedsLogger logger)
             : base(repository, logger)
        {
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string hotelName, string message)
        {
            AddRecord(new HotelFacilitesResyncRow(hotelCode, hotelName), message);
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<HotelFacilitesResyncRow> fileModel, string message)
        {
            AddRecords(fileModel, message);
        }

        /// <inheritdoc />
        protected override ResyncFaciltitesRecord BuildReportRecord(HotelFacilitesResyncRow modelData, string message)
        {
            return new ResyncFaciltitesRecord()
            {
                HotelCode = modelData.GiataCode,
                DateTime = DateTime.UtcNow,
                HotelName = modelData.Name,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(HotelFacilitesResyncRow modelData, string message)
        {
            return $"Hotel {modelData.Name} with {modelData.GiataCode} failed to delete or resync facilities. Reason: {message}.";
        }
    }
}