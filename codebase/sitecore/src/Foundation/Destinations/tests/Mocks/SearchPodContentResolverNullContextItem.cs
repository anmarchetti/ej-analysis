using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.SiteModes.Services;
using Newtonsoft.Json.Linq;
using Sitecore.Abstractions;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.Tests.Mocks
{
    public class SearchPodContentResolverNullContextItem : SearchPodContentResolver
    {
        public SearchPodContentResolverNullContextItem(
            IDatabaseProvider databaseProvider,
            IMarketSettingsService marketSettingsService,
            ISiteModeService service,
            BaseSettings settings,
            IDestinationsLogger logger)
            : base(databaseProvider, marketSettingsService, service, settings, logger)
        {
        }

        public object ResolveDatasourceSub(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            return ResolveDatasource(rendering, renderingConfig);
        }

        protected override Item GetContextItem(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            return null;
        }

        protected override JObject ProcessItem(Item item, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            return new JObject
            {
                { "name", "SearchPod" },
            };
        }
    }
}
