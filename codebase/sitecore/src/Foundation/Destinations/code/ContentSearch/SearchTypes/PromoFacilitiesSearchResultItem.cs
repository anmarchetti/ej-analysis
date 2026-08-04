using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class PromoFacilitiesSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("promo_facilities_list")]
        public string[] PromoFacilities { get; set; }
    }
}