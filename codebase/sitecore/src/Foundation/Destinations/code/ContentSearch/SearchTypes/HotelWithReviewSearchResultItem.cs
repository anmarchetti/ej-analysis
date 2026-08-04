using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class HotelWithReviewSearchResultItem : BaseSearchResultItem
    {
        [IndexField("name")]
        public string ItemName { get; set; }

        [IndexField("starrating")]
        public int StarRating { get; set; }

        [IndexField("totalnumberofreviews")]
        public int TotalNumberOfReviews { get; set; }

        [IndexField("hotelrating")]
        public float HotelRating { get; set; }

        [IndexField("hotel_url")]
        public string HotelUrl { get; set; }

        [IndexField("eco_facility")]
        public string EcoFacility { get; set; }

        [IndexField("normalazied_name")]
        public string NormalaziedName { get; set; }
    }
}