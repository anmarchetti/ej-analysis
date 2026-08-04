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
    [Service(typeof(IRoomFacilityUploadReportService), Lifetime = Lifetime.Singleton)]
    public class RoomFacilityUploadReportService : BaseUploadReportService<RoomFacilityUpload, RoomFacilityUploadRecord>, IRoomFacilityUploadReportService
    {
        public RoomFacilityUploadReportService(IRoomFacilityUploadReportRepository repository, IDestinationsLogger destinationsLogger)
            : base(repository, destinationsLogger)
        {
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<RoomFacilityUpload> roomFacilityUploads, string message)
        {
            AddRecords(roomFacilityUploads, message);
        }

        /// <inheritdoc />
        public void Warn(string atcomCode, string roomCode, string roomName, string facilityCode, string facilityName, string message)
        {
            AddRecord(new RoomFacilityUpload(atcomCode, roomCode, roomName, facilityCode, facilityName), message);
        }

        /// <inheritdoc />
        protected override RoomFacilityUploadRecord BuildReportRecord(RoomFacilityUpload modelData, string message)
        {
            return new RoomFacilityUploadRecord()
            {
                DateTime = DateTime.UtcNow,
                AtcomCode = modelData.AccomCode,
                RoomCode = modelData.RoomCode,
                RoomName = modelData.RoomName,
                Code = modelData.Code,
                FacilityName = modelData.Name,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(RoomFacilityUpload modelData, string message)
        {
            return $"Facility with code {modelData.Code} of room with code {modelData.RoomCode} of accommodation with code {modelData.AccomCode} failed to upload. Reason: {message}.";
        }
    }
}