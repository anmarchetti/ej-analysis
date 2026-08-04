using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Destinations.Reports.Repositories
{
    [Service(typeof(IFamilyFacilityTabUploadRepository), Lifetime = Lifetime.Singleton)]
    public class FamilyFacilityTabUploadRepository : BaseFacilityTabUploadReportRepository, IFamilyFacilityTabUploadRepository
    {
        private const string ReportPathSetting = "Destinations.FamilyFacilitiesUploadReportPath";

        public FamilyFacilityTabUploadRepository(
            IDatasourceRepository datasourceRepository,
            IDatabaseProvider databaseProvider,
            BaseSettings settings)
            : base(datasourceRepository, databaseProvider, settings, ReportPathSetting)
        {
        }
    }
}
