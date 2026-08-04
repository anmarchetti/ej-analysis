using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Destinations.Reports.Repositories
{
    [Service(typeof(IFoodAndDrinkUploadReportRepository), Lifetime = Lifetime.Transient)]
    public class FoodAndDrinkUploadReportRepository : BaseFacilityTabUploadReportRepository, IFoodAndDrinkUploadReportRepository
    {
        public const string ReportPathSetting = "Destinations.FoodAndDrinkUploadReportPath";

        public FoodAndDrinkUploadReportRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
            : base(datasourceRepository, databaseProvider, settings, ReportPathSetting)
        {
        }
    }
}