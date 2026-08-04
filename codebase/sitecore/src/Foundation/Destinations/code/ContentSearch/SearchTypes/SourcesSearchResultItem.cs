using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class SourcesSearchResultItem : BaseSearchResultItem
    {
        [IndexField("sources")]
        public string[] SourceCodes { get; set; }

        [IndexField("name")]
        public string ItemName { get; set; }
    }
}