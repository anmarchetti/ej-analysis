using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IBoardTypesRepository
    {
        /// <summary>
        /// Get Board Types from Solr by provided <paramref name="codes"/>.
        /// </summary>
        /// <param name="codes">Collection of codes.</param>
        /// <returns>Search Results collection of <see cref="BaseDatasourceSearchResultItem"/>.</returns>
        SearchResults<BaseDatasourceSearchResultItem> SearchByCodes(string[] codes);

        /// <summary>
        /// Get all Board Types items from Sitecore.
        /// </summary>
        /// <param name="databaseName">Sitecore database name.</param>
        /// <returns>Items collection.</returns>
        IEnumerable<Item> GetAllBoardTypeItems(string databaseName = "");
    }
}