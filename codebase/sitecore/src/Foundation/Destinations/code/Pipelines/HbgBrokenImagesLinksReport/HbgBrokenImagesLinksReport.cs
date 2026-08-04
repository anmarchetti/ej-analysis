using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Processors;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.Abstractions;

namespace easyJet.Foundation.Destinations.Pipelines.HbgBrokenImagesLinksReport
{
    public class HbgBrokenImagesLinksReport : BrokenImagesLinksReportProcessorBase
    {
        public HbgBrokenImagesLinksReport(
            IDatabaseProvider databaseProvider,
            IDestinationsRepository destinationsRepository,
            IDestinationsLogger logger,
            IDatasourceRepository datasourceRepository,
            BaseSettings settings,
            BaseMediaManager mediaManager,
            IImagesService imagesService)
            : base(databaseProvider, destinationsRepository, logger, datasourceRepository, settings, mediaManager, imagesService, ImageType.HBG)
        {
        }
    }
}