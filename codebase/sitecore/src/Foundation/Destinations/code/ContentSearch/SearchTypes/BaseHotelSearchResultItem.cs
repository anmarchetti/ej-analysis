using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class BaseHotelSearchResultItem : BaseDatasourceSearchResultItem
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

        [IndexField("children")]
        public string[] Children { get; set; }

        [IndexField("image_url")]
        public string ImageUrl { get; set; }
    }
}