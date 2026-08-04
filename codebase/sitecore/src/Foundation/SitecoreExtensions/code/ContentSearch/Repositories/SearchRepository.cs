using System;
using System.Linq;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BasePredicates;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.Settings;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.ContentSearch.Repositories
{
    public abstract class SearchRepository : ISearchRepository
    {
        protected IProviderSearchContext Context { get; set; }

        protected SearchRepository(ISearchSettings indexSettings)
        {
            var index = GetIndex(indexSettings);
            Context = index.CreateSearchContext();
        }

        /// <inheritdoc/>
        public SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, int offset = 0, bool shouldSearchInAllVersions = false, bool shouldSearchInContextLang = true, bool shouldSearchInContextSite = false)
            where T : BaseSearchResultItem
        {
            var baseQuery = PredicateBuilder.True<T>();

            if (shouldSearchInContextLang)
            {
                baseQuery = baseQuery.MatchContextLanguage();
            }

            if (shouldSearchInContextSite)
            {
                baseQuery = baseQuery.MatchContextSite();
            }

            if (!shouldSearchInAllVersions)
            {
                baseQuery = baseQuery.IsLatestVersion();
            }

            if (take > 0)
            {
                page = page < 1 ? 1 : page;
                var skip = ((page - 1) * take) + offset;
                query = query.Skip(skip >= 0 ? skip : (page - 1) * take);
                query = query.Take(take);
            }

            query = query.Where(baseQuery);

            return query.GetResults();
        }

        public void Dispose()
        {
            // Dispose only IProviderSearchContext
            // Important! Never dispose search index
            Context.Dispose();
        }

        /// <summary>
        /// Returns index for current database if we cannot recive index then we use default index.
        /// </summary>
        /// <param name="settings">Settings for index: default indexname and indexname.</param>
        /// <returns>Search index or index by default.</returns>
        private ISearchIndex GetIndex(ISearchSettings settings)
        {
            try
            {
                return ContentSearchManager.GetIndex(settings.IndexName);
            }
            catch (Exception)
            {
                Log.Info($"Could not resolve index by name {settings.IndexName}. Index with {settings.DefaultIndexName} created.", this);
                return ContentSearchManager.GetIndex(settings.DefaultIndexName);
            }
        }
    }
}