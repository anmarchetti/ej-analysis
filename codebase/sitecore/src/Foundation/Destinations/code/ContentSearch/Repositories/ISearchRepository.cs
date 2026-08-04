using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch.Linq;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface ISearchRepository : IDisposable
    {
        SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, bool shouldGetFirstVersion = false, bool orderByName = true, Language language = null)
            where T : BaseSearchResultItem;

        IEnumerable<SearchHit<T>> SearchAll<T>(IQueryable<T> query, int batchSize, bool shouldGetFirstVersion = false, bool orderByName = true)
            where T : BaseSearchResultItem;
    }
}
