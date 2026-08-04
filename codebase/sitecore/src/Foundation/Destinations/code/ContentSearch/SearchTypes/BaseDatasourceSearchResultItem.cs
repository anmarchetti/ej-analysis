using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    public class BaseDatasourceSearchResultItem : SourcesSearchResultItem
    {
        [IndexField("tmp_code")]
        public string Code { get; set; }

        [IndexField("Image")]
        public string Image { get; set; }
    }
}