using System.Web.Mvc;
using easyJet.Foundation.SitecoreExtensions.Attributes;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.Controllers;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Feature.Tracker.Controllers
{
    public class DestinationProfileController : BaseServicesApiController
    {
        private const string ReportName = "ExportRegionsReport";

        private readonly ICustomCacheRepository cacheRepository;

        public DestinationProfileController(ICustomCacheRepository cacheRepository, ICsvUtilsService csvUtilsService)
        {
            this.cacheRepository = cacheRepository;
        }

        /// <summary>
        /// Exports hotels with themes.
        /// </summary>
        /// <returns>File in csv format.</returns>
        [LogExecutionTime]
        public ActionResult ExportRegionProfileThemes()
        {
            var data = cacheRepository.GetItem<byte[]>(Constants.Profiles.HotelThemesProfileExportCacheKey);
            return ExcelFile(data, $"{ReportName}_destinations_profiles");
        }
    }
}