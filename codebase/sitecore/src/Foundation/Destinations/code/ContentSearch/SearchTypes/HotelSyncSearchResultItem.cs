using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelSyncSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("greatdeal")]
        public bool IsGreatDeal { get; set; }

        [IndexField("hotelbedscode")]
        public string HotelBedsCode { get; set; }

        [IndexField("eco_facility")]
        public string EcoFacility { get; set; }
    }
}