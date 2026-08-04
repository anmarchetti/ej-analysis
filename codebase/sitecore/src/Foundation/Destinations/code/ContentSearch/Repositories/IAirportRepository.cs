using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IAirportRepository
    {
        /// <summary>
        /// Get Airports groups from Solr by provided <paramref name="countryCodes"/>.
        /// </summary>
        /// <param name="countryCodes">Airport group country codes.</param>
        /// <returns>Search Results collection of <see cref="AirportsGroupSearchResultItem"/>.</returns>
        SearchResults<AirportsGroupSearchResultItem> SearchByCountryCode(string[] countryCodes);

        /// <summary>
        /// Get airport codes item ids mapping.
        /// </summary>
        /// <param name="sitePath">Site root path.</param>
        /// <returns>Dictionary of Airport codes ids mapping.</returns>
        Dictionary<string, ID> GetAirportCodesItemIds(string sitePath = null);

        /// <summary>
        /// Search by airport codes.
        /// </summary>
        /// <param name="codes">Collection of airport codes.</param>
        /// <returns>Collection of airports.</returns>
        SearchResults<BaseDatasourceSearchResultItem> SearchByAirportCode(List<string> codes);
    }
}