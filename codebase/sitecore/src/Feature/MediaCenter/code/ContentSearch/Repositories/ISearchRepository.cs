using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Feature.MediaCenter.ContentSearch.Repositories
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
        /// <returns>SearchResults.</returns>
        SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, int offset = 0)
            where T : BaseSearchResultItem;
    }
}
