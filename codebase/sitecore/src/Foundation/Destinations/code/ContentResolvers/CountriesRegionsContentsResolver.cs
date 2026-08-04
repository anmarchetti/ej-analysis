using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.Cache.Repositories;
using easyJet.Foundation.SitecoreExtensions.ContentResolvers;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Newtonsoft.Json.Linq;
using Sitecore;
using Sitecore.Data.Items;
using Sitecore.LayoutService.Configuration;
using Sitecore.Mvc.Presentation;

namespace easyJet.Foundation.Destinations.ContentResolvers
{
    public class CountriesRegionsContentsResolver : MultiLanguageRenderingResolver
    {
        private readonly IDestinationsLogger destinationsLogger;

        public CountriesRegionsContentsResolver(IDestinationsLogger destinationsLogger)
        {
            this.destinationsLogger = destinationsLogger;
        }

        /// <summary>
        /// Process collection if items with their children.
        /// </summary>
        /// <param name="items">Datasource child items (Countries).</param>
        /// <param name="rendering">Rendering.</param>
        /// <param name="renderingConfig">Rendering Config.</param>
        /// <returns>Colections of items (Countries) and their children (Regions).</returns>
        protected override JArray ProcessItems(IEnumerable<Item> items, Rendering rendering, IRenderingConfiguration renderingConfig)
        {
            Item contextItem = GetContextItem(rendering, renderingConfig);
            JArray countries = new JArray();
            var countryItems = items.Where(x => x != null && x.TemplateID.Equals(Constants.TemplateIds.CountryPage)).OrderBy(x => x.DisplayName);
            foreach (Item item in countryItems)
            {
                try
                {
                    var country = TojObject(item);
                    var regions = item.Children.Where(x => x.TemplateID.Equals(Constants.TemplateIds.RegionPage) || x.TemplateID.Equals(Constants.TemplateIds.RegionCityPage) || x.TemplateID.Equals(Constants.TemplateIds.VirtualRegion)).CheckVersion(contextItem);

                    var countryRegions = regions.OrderBy(x => x.DisplayName).Select(x => TojObject(x));

                    country["Regions"] = new JArray(countryRegions);

                    countries.Add(country);
                }
                catch (Exception exc)
                {
                    destinationsLogger.Error($"Error occured while processing country: {item?.Name} ({item?.ID})", exc, this);
                }
            }

            return countries;
        }

        /// <summary>
        /// Converts destination Item to JObjects.
        /// </summary>
        /// <param name="item">Destination item.</param>
        /// <returns>JObject.</returns>
        private JObject TojObject(Item item)
        {
            var result = new JObject()
            {
                ["Id"] = item.ID.Guid.ToString(),
                ["Type"] = item.TemplateName,
                [Constants.Fields.DatasourceItem.Code] = item[Constants.Fields.DatasourceItem.Code],
                [Constants.Fields.DatasourceItem.Name] = item[Constants.Fields.DatasourceItem.Name],
            };

            if (item.Versions.Count > 0 && !string.IsNullOrWhiteSpace(item.Fields[FieldIDs.LayoutField]?.Value))
            {
                result["Url"] = item.GetItemUrl();
            }

            return result;
        }
    }
}