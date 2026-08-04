using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class ItinerarySearchResultItem : BaseDatasourceSearchResultItem
    {
        [IndexField("itineraries_list")]
        public string Itineraries { get; set; }
    }
}