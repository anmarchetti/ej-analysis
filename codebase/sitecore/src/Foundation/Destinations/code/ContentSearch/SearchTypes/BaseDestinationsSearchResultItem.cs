using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class BaseDestinationsSearchResultItem : DestinationSearchResultItem
    {
        [IndexField("children")]
        public string[] Children { get; set; }

        [IndexField("image_url")]
        public string ImageUrl { get; set; }

        [IndexField("muzementid")]
        public string MuzementId { get; set; }

        [IndexField("_displayname")]
        public string DisplayName { get; set; }

        [IndexField("tracking_id")]
        public string TrackingId { get; set; }
    }
}