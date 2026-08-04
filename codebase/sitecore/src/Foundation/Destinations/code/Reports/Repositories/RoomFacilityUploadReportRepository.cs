using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Reports.Repositories
{
    [Service(typeof(IRoomFacilityUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class RoomFacilityUploadReportRepository : IRoomFacilityUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.RoomFacilitiesUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public RoomFacilityUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(RoomFacilityUploadRecord record)
        {
            if (uploadReportFolder == null)
            {
                return;
            }

            var item = datasourceRepository.GetOrCreateItem($"{record.AtcomCode} - {record.RoomCode} - {record.FacilityName} - {record.DateTime}", Constants.TemplateIds.RoomFacilityUploadReport, uploadReportFolder, false);

            var changes = new Dictionary<string, string>
            {
                { Constants.Fields.BaseRoomUploadReport.AtcomCode, record.AtcomCode },
                { Constants.Fields.BaseRoomUploadReport.RoomCode, record.RoomCode },
                { Constants.Fields.BaseRoomUploadReport.RoomName, record.RoomName },
                { Constants.Fields.RoomFacilityUploadReport.Code, record.Code },
                { Constants.Fields.RoomFacilityUploadReport.FacilityName, record.FacilityName },
                { Constants.Fields.BaseRoomUploadReport.Message, record.Message },
                { Constants.Fields.BaseRoomUploadReport.DateTime, DateUtil.ToIsoDate(record.DateTime) }
            };

            item.BulkUpdate(changes);
        }
    }
}