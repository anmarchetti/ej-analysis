using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IHotelOverviewDescriptionUploadReportService
    {
        /// <summary>
        /// Report warning during hotel overview description upload.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="hotelOverviewDescription">Hotel overview description.</param>
        /// <param name="message">Report message.</param>
        void Warn(string hotelCode, string hotelOverviewDescription, string message);

        /// <summary>
        /// Report warning during hotel overview descriptions upload.
        /// </summary>
        /// <param name="hotelOverviewDescriptionsUploads">Failed hotel overview descriptions.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<HotelOverviewDescriptionUpload> hotelOverviewDescriptionsUploads, string message);
    }
}
