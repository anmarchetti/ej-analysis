using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IRoomNameUploadReportService
    {
        /// <summary>
        /// Report warning during room name upload.
        /// </summary>
        /// <param name="atcomCode">AtcomCode.</param>
        /// <param name="roomCode">Code of room.</param>
        /// <param name="roomName">Name of room.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(string atcomCode, string roomCode, string roomName, string message);

        /// <summary>
        /// Report warning during room name upload.
        /// </summary>
        /// <param name="roomNameUpload">Failed room names.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<RoomNameUpload> roomNameUpload, string message);
    }
}