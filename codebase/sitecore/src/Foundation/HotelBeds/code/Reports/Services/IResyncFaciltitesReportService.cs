using System.Collections.Generic;
using easyJet.Foundation.HotelBeds.Models.Domain;

namespace easyJet.Foundation.HotelBeds.Reports.Services
{
    public interface IResyncFaciltitesReportService
    {
        /// <summary>
        /// Report warning during resyncing hotel's facilities.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="hotelName">Hotel name.</param>
        /// <param name="message">Report message.</param>
        void Warn(string hotelCode, string hotelName, string message);

        /// <summary>
        /// Report warning during resyncing hotel's facilities.
        /// </summary>
        /// <param name="fileModel">Invalid file model row.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<HotelFacilitesResyncRow> fileModel, string message);
    }
}
