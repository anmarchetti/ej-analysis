using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data;

namespace easyJet.Foundation.Destinations.Services
{
    public interface ISearchFiltersService
    {
        /// <summary>
        /// Get search filters.
        /// </summary>
        /// <param name="database">Sitecore database.</param>
        /// <returns>Search filters.</returns>
        SearchFilter GetSearchFilters(Database database);

        /// <summary>
        /// Get search facility matrix configuration.
        /// </summary>
        /// <returns>Search filters.</returns>
        List<FacilityMatrixConfiguration> GetFacilityMatrixConfigurations();
    }
}
