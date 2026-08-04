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
    [Service(typeof(IHotelBoardDescriptionsUploadReportRepository), Lifetime = Lifetime.Singleton)]
    public class HotelBoardDescriptionsUploadReportRepository : IHotelBoardDescriptionsUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.HotelBoardDescriptionsUploadReportPath";
        private readonly IDatasourceRepository datasourceRepository;
        private readonly Item uploadReportFolder;

        public HotelBoardDescriptionsUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            var reportSettingsPath = settings.GetSetting(ReportPathSetting);
            uploadReportFolder = databaseProvider.GetItem(reportSettingsPath, DatabaseType.Content);
        }

        /// <inheritdoc />
        public void Add(HotelBoardDescriptionUploadRecord record)
        {
            if (uploadReportFolder != null)
            {
                var item = datasourceRepository.CreateItem($"{record.HotelCode} - {record.BoardCode} - {record.DateTime}", Constants.TemplateIds.HotelBoardDescriptionUploadReport, uploadReportFolder, false);

                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new EventDisabler())
                {
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.HotelCode].Value = record.HotelCode;
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.HotelName].Value = record.HotelName;
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.BoardCode].Value = record.BoardCode;
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.BoardName].Value = record.BoardName;
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.Message].Value = record.Message;
                    item.Fields[Constants.Fields.HotelBoardDescriptionUploadReport.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                }
            }
        }
    }
}