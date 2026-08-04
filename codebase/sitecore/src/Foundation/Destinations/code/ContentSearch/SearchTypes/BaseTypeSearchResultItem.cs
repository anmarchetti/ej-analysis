using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Destinations.ContentSearch.SearchTypes
{
    /// <summary>
    /// Base model for reference data types like room and board types.
    /// </summary>
    public class BaseTypeSearchResultItem : BaseSearchResultItem
    {
        [IndexField("code")]
        public string Code { get; set; }

        [IndexField("name")]
        public string Title { get; set; }

        [IndexField("description")]
        public string Description { get; set; }

        [IndexField("content")]
        public string RichTextContent { get; set; }
    }
}