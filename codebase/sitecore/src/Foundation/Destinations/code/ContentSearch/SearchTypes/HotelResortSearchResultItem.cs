using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelResortSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("resort_image_url")]
        public string ResortImageUrl { get; set; }

        [IndexField("resort_description")]
        public string ResortDescription { get; set; }
    }
}