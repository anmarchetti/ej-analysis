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
    [Service(typeof(IHotelThemesUploadReportService), Lifetime = Lifetime.Singleton)]
    public class HotelThemesUploadReportService : BaseUploadReportService<HotelWithThemeRow, HotelThemesUploadRecord>, IHotelThemesUploadReportService
    {
        public HotelThemesUploadReportService(IHotelsThemesUploadReportRepository repository, IDestinationsLogger destinationsLogger)
            : base(repository, destinationsLogger)
        {
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<HotelWithThemeRow> hotelThemesUploadRecords, string message)
        {
            AddRecords(hotelThemesUploadRecords, message);
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string hotelName, string hotelTheme, string themeCode, string hotelType, string hotelTypeCode, string message)
        {
            AddRecord(new HotelWithThemeRow(hotelCode, hotelName, hotelTheme, themeCode, hotelType, hotelTypeCode), message);
        }

        /// <inheritdoc />
        protected override HotelThemesUploadRecord BuildReportRecord(HotelWithThemeRow modelData, string message)
        {
            return new HotelThemesUploadRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = modelData.HotelCode,
                HotelName = modelData.HotelName,
                HotelTheme = modelData.HotelThemeName,
                HotelThemeCode = modelData.HotelThemeCode,
                HotelType = modelData.HotelTypeName,
                HotelTypeCode = modelData.HotelTypeCode,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(HotelWithThemeRow modelData, string message)
        {
            return $"Theme {modelData.HotelThemeName} with code {modelData.HotelThemeCode} and type {modelData.HotelTypeName} with code {modelData.HotelTypeCode} for hotel {modelData.HotelName} with code {modelData.HotelCode} failed to upload. Reason: {message}.";
        }
    }
}