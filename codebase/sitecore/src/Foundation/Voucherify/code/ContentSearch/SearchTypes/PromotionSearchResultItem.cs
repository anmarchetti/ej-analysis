using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Voucherify.ContentSearch.SearchTypes
{
    public class PromotionSearchResultItem : BaseSearchResultItem
    {
        [IndexField("market_codes")]
        public string[] MarketCodes { get; set; }

        [IndexField("customerpromocode")]
        public string CustomerPromoCode { get; set; }

        [IndexField("atcompromocode")]
        public string AtcomPromoCode { get; set; }

        [IndexField("sortorder")]
        public int SortOrder { get; set; }

        [IndexField("promotion_codes")]
        public string[] PromotionCodes { get; set; }
    }
}