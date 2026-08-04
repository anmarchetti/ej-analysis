using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface IDestinationsSearchFiltersRepository : ISearchRepository
    {
        SearchResults<HotelSearchResultItem> GetAllFiltersByAccommodationCodes(List<string> codes);
    }
}
