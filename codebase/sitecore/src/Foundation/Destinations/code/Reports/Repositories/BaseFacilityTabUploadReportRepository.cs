using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Events;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.Destinations.Reports.Repositories
{
    public abstract class BaseFacilityTabUploadReportRepository
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        protected BaseFacilityTabUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings,
            string reportPathSetting)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(reportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        public virtual void Add(FacilityTabUploadRecord record)
        {
            if (uploadReportFolder != null)
            {
                var item = datasourceRepository.CreateItem($"{record.HotelCode} - {record.HotelName} - {record.DateTime.Ticks}", Constants.TemplateIds.FacilitiesUploadReport, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Fields.FoodAndDrinkUploadReport.HotelCode].Value = record.HotelCode;
                    item.Fields[Constants.Fields.FoodAndDrinkUploadReport.HotelName].Value = record.HotelName;
                    item.Fields[Constants.Fields.FoodAndDrinkUploadReport.Message].Value = record.Message;
                    item.Fields[Constants.Fields.FoodAndDrinkUploadReport.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}