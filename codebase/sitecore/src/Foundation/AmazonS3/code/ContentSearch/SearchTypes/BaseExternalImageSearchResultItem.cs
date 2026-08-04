using System.Diagnostics.CodeAnalysis;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.AmazonS3.ContentSearch.SearchTypes
{
    [ExcludeFromCodeCoverage]
    public class BaseExternalImageSearchResultItem : BaseSearchResultItem
    {
        [IndexField("large")]
        public string LargeImageUrl { get; set; }
    }
}