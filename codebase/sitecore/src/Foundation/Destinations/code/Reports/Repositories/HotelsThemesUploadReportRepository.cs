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
    [Service(typeof(IHotelsThemesUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class HotelsThemesUploadReportRepository : IHotelsThemesUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.HotelThemesUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public HotelsThemesUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(HotelThemesUploadRecord record)
        {
            if (uploadReportFolder != null)
            {
                var item = datasourceRepository.CreateItem($"{record.HotelCode} - {record.HotelTypeCode} - {record.DateTime}", Constants.TemplateIds.HotelThemesUploadReport, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelCode].Value = record.HotelCode;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelName].Value = record.HotelName;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelTheme].Value = record.HotelTheme;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelThemeCode].Value = record.HotelThemeCode;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelType].Value = record.HotelType;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.HotelTypeCode].Value = record.HotelTypeCode;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.Message].Value = record.Message;
                    item.Fields[Constants.Fields.HotelThemesUploadReport.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}