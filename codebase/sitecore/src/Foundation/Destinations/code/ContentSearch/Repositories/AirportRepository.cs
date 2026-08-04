using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Multisite;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using easyJet.Foundation.SitecoreExtensions.Services;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    /// <summary>
    /// Represents Search logic for Airport items.
    /// </summary>
    [Service(typeof(IAirportRepository), Lifetime = Lifetime.Transient)]
    public class AirportRepository : SearchRepository, IAirportRepository
    {
        private readonly IDatabaseProvider databaseProvider;

        public AirportRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger, IDatabaseProvider databaseProvider)
            : base(indexSettings, logger)
        {
            this.databaseProvider = databaseProvider;
        }

        /// <inheritdoc/>
        public SearchResults<AirportsGroupSearchResultItem> SearchByCountryCode(string[] countryCodes)
        {
            logger.Info($@"Calling {nameof(SearchAll)} with {nameof(countryCodes)}:'{string.Join(", ", countryCodes ?? Array.Empty<string>())}'", this);

            var query = Context.GetQueryable<AirportsGroupSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.AirportsGroup);

            if (countryCodes.Any())
            {
                var predicate = PredicateBuilder.True<AirportsGroupSearchResultItem>();
                foreach (var code in countryCodes)
                {
                    predicate = predicate.Or(item => item.Code == code);
                }

                query = query.Where(predicate);
            }

            return Search(query, orderByName: false);
        }

        /// <inheritdoc/>
        public SearchResults<BaseDatasourceSearchResultItem> SearchByAirportCode(List<string> codes)
        {
            logger.Info($@"Calling {nameof(SearchByAirportCode)} with {nameof(codes)}:'{string.Join(", ", codes ?? new List<string>())}'", this);
            var query = Context.GetQueryable<BaseDatasourceSearchResultItem>()
                .Where(item => item.TemplateId == Constants.TemplateIds.Airport);

            var predicate = PredicateBuilder.True<BaseDatasourceSearchResultItem>();
            if (codes != null)
            {
                foreach (var code in codes)
                {
                    predicate = predicate.Or(item => item.Code == code);
                }
            }

            query = query.Where(predicate);

            return Search(query, orderByName: false);
        }

        /// <inheritdoc/>
        public Dictionary<string, ID> GetAirportCodesItemIds(string sitePath = null)
        {
            logger.Info($@"Calling {nameof(GetAirportCodesItemIds)} with {nameof(sitePath)}:'{sitePath}'", this);
            var airportItems = GetAirportItems(sitePath);

            return airportItems
                .GroupBy(item => item[Constants.Fields.DatasourceItem.Code]).ToDictionary(x => x.Key, x => x.First().ID);
        }

        /// <summary>
        /// Get airport items from sitecore.
        /// </summary>
        /// <returns>Item's collection.</returns>
        private IEnumerable<Item> GetAirportItems(string sitePath = null)
        {
            logger.Info($@"Calling {nameof(GetAirportItems)} with {nameof(sitePath)}:'{sitePath}'", this);
            var path = string.IsNullOrWhiteSpace(sitePath) ? Sitecore.Context.Site.RootPath : sitePath;
            var airportFolder = databaseProvider.SelectSingleItem($"{path}" + $"/*[@@templateid='{Templates.Data.Id}']" + $"/*[@@templateid='{Constants.TemplateIds.AirportsFolder}']", DatabaseType.Content);
            var airportItems = new List<Item>();

            if (airportFolder != null)
            {
                foreach (Item airportGroup in airportFolder.Children)
                {
                    var airports = airportGroup.Axes.SelectItems($".//*[@@templateid='{Constants.TemplateIds.Airport}']");

                    if (airports != null)
                    {
                        airportItems.AddRange(airports);
                    }
                }
            }

            return airportItems;
        }
    }
}