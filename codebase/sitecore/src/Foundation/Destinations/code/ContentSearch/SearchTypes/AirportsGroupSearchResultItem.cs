using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class AirportsGroupSearchResultItem : BaseDatasourceSearchResultItem
    {
        [IndexField("airports_list")]
        public string[] Airports { get; set; }
    }
}