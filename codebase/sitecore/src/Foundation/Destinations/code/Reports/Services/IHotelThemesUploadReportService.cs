using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IHotelThemesUploadReportService
    {
        /// <summary>
        /// Report warning during room facility upload.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="hotelName">Hotel name.</param>
        /// <param name="hotelTheme">Hotel theme name.</param>
        /// <param name="themeCode">Hotel theme code.</param>
        /// <param name="hotelType">Hotel theme type name.</param>
        /// <param name="hotelTypeCode">Hotel theme type code.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(string hotelCode, string hotelName, string hotelTheme, string themeCode, string hotelType, string hotelTypeCode, string message);

        /// <summary>
        /// Report warning during hotel themes upload.
        /// </summary>
        /// <param name="hotelThemesUploadRecords">Failed hotels.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<HotelWithThemeRow> hotelThemesUploadRecords, string message);
    }
}