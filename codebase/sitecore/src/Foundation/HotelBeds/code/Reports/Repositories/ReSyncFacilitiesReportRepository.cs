using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.HotelBeds.Reports.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.HotelBeds.Reports.Repositories
{
    [Service(typeof(IReSyncFacilitiesReportRepository), Lifetime = Lifetime.Singleton)]
    public class ReSyncFacilitiesReportRepository : IReSyncFacilitiesReportRepository
    {
        public const string ReportPathSetting = "HotelBeds.ResyncFacilitiesReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public ReSyncFacilitiesReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(ResyncFaciltitesRecord record)
        {
            if (uploadReportFolder != null && record != null)
            {
                var item = datasourceRepository.CreateItem($"{record.HotelCode}-{record.DateTime}", Constants.Templates.ResyncFacilititesRecord.ID, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.HotelCode].Value = record.HotelCode;
                    item.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.HotelName].Value = record.HotelName;
                    item.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.Message].Value = record.Message;
                    item.Fields[Constants.Templates.ResyncFacilititesRecord.Fields.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}