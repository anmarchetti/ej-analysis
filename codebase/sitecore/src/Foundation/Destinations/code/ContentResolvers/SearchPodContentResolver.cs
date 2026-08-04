using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SiteModes.Services;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class SearchPodContentResolver : AirportsContentResolver
    {
        private readonly string searchPodDefaultPath;
        private readonly IDatabaseProvider databaseProvider;

        public SearchPodContentResolver(
            IDatabaseProvider databaseProvider,
            IMarketSettingsService marketSettingsService,
            ISiteModeService service,
            BaseSettings settings,
            IDestinationsLogger logger)
            : base(marketSettingsService, service, logger)
        {
            searchPodDefaultPath = settings.GetSetting("Destinations.SearchPodDefaultPath");
            this.databaseProvider = databaseProvider;
        }

        /// <inheritdoc/>
        protected override object ResolveDatasource(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            // if datasource is set resolve datasource from provided item, if not fallback to default datasource
            Item item = GetContextItem(rendering, renderingConfig) ?? databaseProvider.GetItem(searchPodDefaultPath);
            if (item == null)
            {
                return base.ResolveDatasource(rendering, renderingConfig);
            }

            return ProcessItem(item, rendering, renderingConfig);
        }
    }
}