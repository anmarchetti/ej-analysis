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
    [Service(typeof(IRoomNameUploadReportService), Lifetime = Lifetime.Singleton)]
    public class RoomNameUploadReportService : BaseUploadReportService<RoomNameUpload, RoomNameUploadRecord>, IRoomNameUploadReportService
    {
        public RoomNameUploadReportService(IRoomNameUploadReportRepository repository, IDestinationsLogger logger)
            : base(repository, logger)
        {
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<RoomNameUpload> roomNameUpload, string message)
        {
            AddRecords(roomNameUpload, message);
        }

        /// <inheritdoc />
        public void Warn(string atcomCode, string roomCode, string roomName, string message)
        {
            AddRecord(new RoomNameUpload(atcomCode, roomCode, roomName), message);
        }

        /// <inheritdoc />
        protected override RoomNameUploadRecord BuildReportRecord(RoomNameUpload modelData, string message)
        {
            return new RoomNameUploadRecord()
            {
                DateTime = DateTime.UtcNow,
                AtcomCode = modelData.AccomCode,
                RoomCode = modelData.RoomCode,
                RoomName = modelData.RoomName,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(RoomNameUpload modelData, string message)
        {
            return $"Room with code {modelData.RoomCode} of accommodation with code {modelData.AccomCode} failed to upload. Reason: {message}.";
        }
    }
}