using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IFacilityUploadReportService
    {
        /// <summary>
        /// Report warning during facility upload.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="facilityCode">Facility code.</param>
        /// <param name="facilityName">Facility name.</param>
        /// <param name="facilityGroup">Facility group.</param>
        /// <param name="hotelName">Hotel name.</param>
        /// <param name="facilityFilterGroup">Facility filter group.</param>
        /// <param name="message">Report message.</param>
        void Warn(string hotelCode, string facilityCode, string facilityName, string facilityGroup, string hotelName, string facilityFilterGroup, string message);

        /// <summary>
        /// Report warning during faclities upload.
        /// </summary>
        /// <param name="facilityUploads">Failed facilities.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<FacilityUpload> facilityUploads, string message);
    }
}
