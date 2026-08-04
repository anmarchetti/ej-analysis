using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IRoomFacilityUploadReportService
    {
        /// <summary>
        /// Report warning during room facility upload.
        /// </summary>
        /// <param name="atcomCode">AtcomCode.</param>
        /// <param name="roomCode">Code of room.</param>
        /// <param name="roomName">Name of room.</param>
        /// <param name="facilityCode">Code of facility.</param>
        /// <param name="facilityName">Name of facility.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(string atcomCode, string roomCode, string roomName, string facilityCode, string facilityName, string message);

        /// <summary>
        /// Report warning during room faclities upload.
        /// </summary>
        /// <param name="roomFacilityUploads">Failed room facilities.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<RoomFacilityUpload> roomFacilityUploads, string message);
    }
}
