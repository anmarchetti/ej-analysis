using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
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
    [Service(typeof(IFacilityUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class FacilityUploadReportRepository : IFacilityUploadReportRepository
    {
        public const string FacilitiesUploadReportPath = "Destinations.FacilitiesUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public FacilityUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(FacilitiesUploadReportPath);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(FacilityUploadRecord record)
        {
            if (uploadReportFolder != null)
            {
                var item = datasourceRepository.CreateItem($"{record.HotelCode} - {record.FacilityCode} - {record.DateTime}", Constants.TemplateIds.FacilitiesUploadReportFolder, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Fields.FacilityUploadReport.HotelCode].Value = record.HotelCode;
                    item.Fields[Constants.Fields.FacilityUploadReport.HotelName].Value = record.HotelName;
                    item.Fields[Constants.Fields.FacilityUploadReport.FacilityCode].Value = record.FacilityCode;
                    item.Fields[Constants.Fields.FacilityUploadReport.FacilityName].Value = record.FacilityName;
                    item.Fields[Constants.Fields.FacilityUploadReport.Message].Value = record.Message;
                    item.Fields[Constants.Fields.FacilityUploadReport.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}