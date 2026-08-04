using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.Services
{
    public interface IRequestedSearchesService
    {
        /// <summary>
        /// Gets market specific Requested searches based on marketCode.
        /// </summary>
        /// <param name="marketCode">Code of a market to get Requested Searches for.</param>/>
        /// <returns>Collection of Requested Searches.</returns>
        IEnumerable<RequestedSearch> GetRequestedSearches(string marketCode);

        /// <summary>
        /// Gets requested search object with inheritance from promo page.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <returns>Requseted search object.</returns>
        RequestedSearch GetRequestedSearchItem(Item item);
    }
}
