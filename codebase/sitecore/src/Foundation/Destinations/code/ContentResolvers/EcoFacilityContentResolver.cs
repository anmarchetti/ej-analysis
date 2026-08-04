using System;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Multisite.Extensions;
using Newtonsoft.Json;
using Sitecore.LayoutService.Configuration;
using Sitecore.LayoutService.ItemRendering.ContentsResolvers;
using Sitecore.Mvc.Presentation;
using RenderingContentsResolver = easyJet.Foundation.SitecoreExtensions.ContentResolvers.RenderingContentsResolver;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class EcoFacilityContentResolver : RenderingContentsResolver
    {
        private readonly IDestinationsLogger logger;
        private readonly IDestinationsRepository destinationsRepository;

        public EcoFacilityContentResolver(IDestinationsRepository destinationsRepository, IDestinationsLogger logger)
        {
            this.logger = logger;
            this.destinationsRepository = destinationsRepository;
        }

        public override object ResolveContents(Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            try
            {
                var contextItem = GetContextItem(rendering, renderingConfig);
                if (contextItem == null)
                {
                    return null;
                }

                var dataFolderQuery = rendering.Item.GetDataFolderQuery();
                var datasource = rendering.Item.Database.SelectSingleItem($"{dataFolderQuery}/*[@@templateid ='{Constants.TemplateIds.EcoFacility}']");

                var result = new
                {
                    Data = ProcessItem(datasource, rendering, renderingConfig),
                    EcoFacility = GetEcoFacility(contextItem[Constants.Fields.DatasourceItem.Code])
                };

                return result;
            }
            catch (Exception e)
            {
                logger.Error($"{nameof(EcoFacilityContentResolver)} cannot resolve content for Item {rendering?.Item?.Name}", e, this);
                return null;
            }
        }

        private HotelFacility GetEcoFacility(string hotelCode)
        {
            if (string.IsNullOrEmpty(hotelCode))
            {
                return null;
            }

            var data = destinationsRepository.SearchHotelsByCodes(new string[] { hotelCode })?.FirstOrDefault();
            return data?.Document?.EcoFacility == null ? null : JsonConvert.DeserializeObject<HotelFacility>(data.Document.EcoFacility);
        }
    }
}