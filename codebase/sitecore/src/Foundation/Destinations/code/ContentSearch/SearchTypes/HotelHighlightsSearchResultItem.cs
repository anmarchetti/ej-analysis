using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelHighlightsSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("hotel_highlights")]
        public string HotelHighlights { get; set; }
    }
}