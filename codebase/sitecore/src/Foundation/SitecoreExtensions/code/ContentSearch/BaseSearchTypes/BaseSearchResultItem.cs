using System;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.SearchTypes;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes
{
    public class BaseSearchResultItem : SearchResultItem
    {
        [IndexField(BuiltinFields.LatestVersion)]
        public bool IsLatestVersion { get; set; }

        [IndexField(BuiltinFields.Updated)]
        public DateTime LastUpdated { get; set; }
    }
}