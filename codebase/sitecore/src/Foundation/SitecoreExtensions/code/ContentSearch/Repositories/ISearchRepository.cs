using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Repositories
{
    public interface ISearchRepository : IDisposable
    {
        /// <summary>
        /// Searches the specified query.
        /// </summary>
        /// <typeparam name="T">T is imptlementation of BaseSearchResultItem.</typeparam>
        /// <param name="query">The query.</param>
        /// <param name="page">The page.</param>
        /// <param name="take">Number of items to take.</param>
        /// <param name="offset">Nnumber of item to offset.</param>
        /// <param name="shouldSearchInAllVersions">Indicates if should search in latest version or in all versions.</param>
        /// <param name="shouldSearchInContextLang">Indicates if should search in context language version or accross all languages.</param>
        /// <param name="shouldSearchInContextSite">Indicates if should search in context site version or accross all sites.</param>
        /// <returns>SearchResults.</returns>
        SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, int offset = 0, bool shouldSearchInAllVersions = false, bool shouldSearchInContextLang = true, bool shouldSearchInContextSite = false)
            where T : BaseSearchResultItem;
    }
}
