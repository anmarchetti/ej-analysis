using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelFacilitiesSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("filtered_facility")]
        public string[] FilteredFacilities { get; set; }
    }
}