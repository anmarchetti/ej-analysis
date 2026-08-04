using easyJet.Foundation.AmazonS3.Reports.Models;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;

namespace easyJet.Foundation.AmazonS3.Reports.Repositories
{
    [Service(typeof(IHotelImageReportRepository), Lifetime = Lifetime.Singleton)]
    public class HotelImageReportRepository : IHotelImageReportRepository
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly BaseSettings settings;

        public HotelImageReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
        {
            this.datasourceRepository = datasourceRepository;
            this.databaseProvider = databaseProvider;
            this.settings = settings;
        }

        public void Add(HotelImageStatusRecord record)
        {
            var reportPath = settings.GetSetting(Constants.Settings.ReportPathSettingsName);
            var reportFolder = databaseProvider.GetItem(reportPath, DatabaseType.Master);
            var name = ItemUtil.GetUniqueName(reportFolder, ItemUtil.ProposeValidItemName($"{record.HotelCode} - {record.ImageName}"));
            using (new SecurityDisabler())
            {
                var item = datasourceRepository.GetOrCreateItem(name, Constants.TemplateIds.HotelImageReport, reportFolder, false);
                using (new EditContext(item, SecurityCheck.Disable))
                using (new DatabaseCacheDisabler())
                using (new BulkUpdateContext())
                {
                    item.Fields[Constants.FieldsName.AtcomCode].Value = record.HotelCode;
                    item.Fields[Constants.FieldsName.ImageName].Value = record.ImageName;
                    item.Fields[Constants.FieldsName.Message].Value = record.Message;
                    item.Fields[Constants.FieldsName.DateTime].Value = DateUtil.ToIsoDate(record.DateTime);
                    item.Fields[Constants.FieldsName.Status].Value = record.Status.ToString();
                }
            }
        }
    }
}