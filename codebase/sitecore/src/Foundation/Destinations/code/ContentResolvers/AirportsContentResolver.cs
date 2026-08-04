using System;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Mappers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite.Extensions;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.SiteModes.ContentResolvers;
using easyJet.Foundation.SiteModes.Services;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class AirportsContentResolver : BaseHideMaintenanceModeContentResolver
    {
        private readonly IMarketSettingsService marketSettingsService;

        public AirportsContentResolver(IMarketSettingsService marketSettingsService, ISiteModeService service, IDestinationsLogger logger)
            : base(service, logger)
        {
            this.marketSettingsService = marketSettingsService;
        }

        protected override Func<Rendering, IRenderingConfiguration, object> ExecuteContentResolvingAction => (rendering, renderingConfig) =>
        {
            var dataFolderQuery = rendering.Item.GetDataFolderQuery();

            var dataSource = rendering.Item.Database.SelectSingleItem($"{dataFolderQuery}/*[@@templateid ='{Constants.TemplateIds.AirportsFolder}']");

            var currentDepartureCodesByMarket = marketSettingsService.GetCurrentMarket().AirportDepartureCodes;
            var result = new
            {
                Data = ResolveDatasource(rendering, renderingConfig),
                AirportsGroups = dataSource?.GetChildren()
                .Where(item => item.TemplateID == Constants.TemplateIds.AirportsGroup)
                .Select(item => new AirportsGroup(item)
                {
                    Airports = AirportMapper.BuildAirportGroup(item, currentDepartureCodesByMarket)
                })
                .Where(ag => ag.HasDepartureAirports)
            };

            return result;
        };

        /// <summary>
        /// Resolves the datasource for the rendering.
        /// </summary>
        /// <param name="rendering">The rendering.</param>
        /// <param name="renderingConfig">The rendering configuration.</param>
        /// <returns>The resolved datasource object.</returns>
        protected virtual object ResolveDatasource(Rendering rendering, IRenderingConfiguration renderingConfig) => new RenderingContentsResolver().ResolveContents(rendering, renderingConfig);
    }
}