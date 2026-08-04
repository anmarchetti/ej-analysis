using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IRoomTypesRepository
    {
        /// <summary>
        /// Get all Room Types from Solr.
        /// </summary>
        /// <returns>Search Results collection of <see cref="RoomTypeSearchResultItem"/>.</returns>
        SearchResults<RoomTypeSearchResultItem> GetAll();

        SearchResults<RoomTypeSearchResultItem> Get(int page, int take);

        SearchResults<RoomTypeSearchResultItem> GetByCodes(string[] codes);
    }
}