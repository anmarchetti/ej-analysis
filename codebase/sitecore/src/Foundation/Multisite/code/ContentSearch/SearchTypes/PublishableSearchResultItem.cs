using System;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;

namespace easyJet.Foundation.Multisite.ContentSearch.SearchTypes
{
    public class PublishableSearchResultItem : BaseSearchResultItem
    {
        [IndexField("__publish")]
        public DateTime PublishDate { get; set; }

        [IndexField("__unpublish")]
        public DateTime UnpublishDate { get; set; }

        [IndexField("__valid_from")]
        public DateTime ValidFrom { get; set; }

        [IndexField("__valid_to")]
        public DateTime ValidTo { get; set; }
    }
}