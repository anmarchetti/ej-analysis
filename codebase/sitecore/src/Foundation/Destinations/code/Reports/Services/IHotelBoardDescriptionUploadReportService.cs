using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IHotelBoardDescriptionUploadReportService
    {
        /// <summary>
        /// Report warning during hotel board description upload.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="hotelName">Hotel name.</param>
        /// <param name="boardCode">Board code.</param>
        /// <param name="boardName">Board name.</param>
        /// <param name="message">Report message.</param>
        void Warn(string hotelCode, string hotelName, string boardCode, string boardName, string message);

        /// <summary>
        /// Report warning during hotel board descriptions upload.
        /// </summary>
        /// <param name="hotelBoardDescriptionsUploads">Failed hotel board descriptions.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<HotelBoardDescriptionUpload> hotelBoardDescriptionsUploads, string message);
    }
}
