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

// TODO Create a CSV report instead of sitecore items
namespace easyJet.Foundation.Destinations.Reports.Repositories
{
    [Service(typeof(IHotelOverviewDescriptionsUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class HotelOverviewDescriptionsUploadReportRepository : IHotelOverviewDescriptionsUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.HotelOverviewDescriptionsUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public HotelOverviewDescriptionsUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(HotelOverviewDescriptionUploadRecord record)
        {
            if (uploadReportFolder != null)
            {
                var item = datasourceRepository.CreateItem($"{record.GiataCode} - {record.DateTime}", Constants.TemplateIds.HotelOverviewDescriptionUploadReport, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.GiataCode].Value = record.GiataCode;
                    item.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.HotelOverviewDescription].Value = record.HotelOverviewDescription;
                    item.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.Message].Value = record.Message;
                    item.Fields[Constants.Fields.HotelOverviewDescriptionUploadReport.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}