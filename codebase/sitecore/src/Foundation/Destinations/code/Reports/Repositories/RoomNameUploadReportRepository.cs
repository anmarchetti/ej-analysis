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
    [Service(typeof(IRoomNameUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class RoomNameUploadReportRepository : IRoomNameUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.RoomNamesUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public RoomNameUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(RoomNameUploadRecord record)
        {
            if (uploadReportFolder == null)
            {
                return;
            }

            var item = datasourceRepository.GetOrCreateItem($"{record.AtcomCode} - {record.RoomCode} - {record.DateTime}", Constants.TemplateIds.RoomNameUploadReport, uploadReportFolder, false);

            var changes = new Dictionary<string, string>()
            {
                { Constants.Fields.BaseRoomUploadReport.AtcomCode, record.AtcomCode },
                { Constants.Fields.BaseRoomUploadReport.RoomCode, record.RoomCode },
                { Constants.Fields.BaseRoomUploadReport.RoomName, record.RoomName },
                { Constants.Fields.BaseRoomUploadReport.Message, record.Message },
                { Constants.Fields.BaseRoomUploadReport.DateTime, DateUtil.ToIsoDate(record.DateTime) }
            };
            item.BulkUpdate(changes);
        }
    }
}