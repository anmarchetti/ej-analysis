using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class DestinationSearchResultItem : BaseDatasourceSearchResultItem
    {
        [IndexField("giatacode")]
        public string GiataCode { get; set; }

        [IndexField("airport_codes")]
        public string[] AirportCodes { get; set; }

        [IndexField("parents")]
        public string[] Parents { get; set; }

        [IndexField("sort_order")]
        public int SortOrder { get; set; }

        [IndexField("showonsearchpod")]
        public bool ShowOnSearchPod { get; set; }

        [IndexField("showinautocomplete")]
        public bool ShowInAutocomplete { get; set; }

        [IndexField("showondropdown")]
        public bool ShowOnDropdown { get; set; }

        [IndexField("related_regions")]
        public string[] RelatedRegions { get; set; }

        [IndexField("related_resorts")]
        public string[] RelatedResorts { get; set; }

        [IndexField("_displayname")]
        public string DisplayName { get; set; }

        [IndexField("normalazied_name")]
        public string NormalaziedName { get; set; }

        [IndexField("promo_collections")]
        public string[] PromoCollections { get; set; }

        /// <summary>
        /// Gets or sets Hotel Theme
        /// </summary>
        [IndexField("hotel_theme")]
        public string HotelTheme { get; set; }

        /// <summary>
        /// Gets or sets tracking id
        /// </summary>
        [IndexField("tracking_id")]
        public string TrackingId { get; set; }
    }
}