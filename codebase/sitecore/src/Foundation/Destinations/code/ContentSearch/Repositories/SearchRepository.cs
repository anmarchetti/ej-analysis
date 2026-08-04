using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BasePredicates;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Diagnostics;
using Sitecore.Globalization;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public abstract class SearchRepository : ISearchRepository
    {
        protected readonly IDestinationsLogger logger;
        private readonly IDestinationSearchSettings indexSettings;

        protected IProviderSearchContext Context { get; set; }

        protected SearchRepository(IDestinationSearchSettings indexSettings, IDestinationsLogger logger)
        {
            this.logger = logger;
            this.indexSettings = indexSettings;
            var index = GetIndex(indexSettings);
            Context = index.CreateSearchContext();
        }

        /// <summary>
        /// Searches the specified query.
        /// </summary>
        /// <typeparam name="T">T.</typeparam>
        /// <param name="query">The query.</param>
        /// <param name="page">The page.</param>
        /// <param name="take">Number of items to take.</param>
        /// <param name="shouldGetFirstVersion">Indicate should get first or last version.</param>
        /// <param name="orderByName">Specify whether to order the results by item name.</param>
        /// <param name="language">Specifies context language for the search if not passed current context language is used.</param>
        /// <returns>SearchResults.</returns>
        public SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, bool shouldGetFirstVersion = false, bool orderByName = true, Language language = null)
            where T : BaseSearchResultItem
        {
            logger.Debug($@"Calling {nameof(SearchAll)} with {nameof(page)}:'{page}', {nameof(take)}:'{take}', {nameof(shouldGetFirstVersion)}:'{shouldGetFirstVersion}', {nameof(orderByName)}:'{orderByName}'", this);
            var baseQuery = PredicateBuilder.True<T>();

            baseQuery = language == null ? baseQuery.MatchContextLanguage() : baseQuery.WithLanguage(language);
            baseQuery = baseQuery.MatchRootPath(indexSettings.Root);
            baseQuery = shouldGetFirstVersion ? baseQuery.IsFirstVersion() : baseQuery.IsLatestVersion();

            if (take > 0)
            {
                page = page < 1 ? 1 : page;
                query = query.Skip((page - 1) * take);
                query = query.Take(take);
            }

            query = query.Where(baseQuery);

            if (orderByName)
            {
                query = query.OrderBy(x => x.Name);
            }

            return query.GetResults();
        }

        public IEnumerable<SearchHit<T>> SearchAll<T>(IQueryable<T> query, int batchSize, bool shouldGetFirstVersion = false, bool orderByName = true)
            where T : BaseSearchResultItem
        {
            logger.Debug($@"Calling {nameof(SearchAll)} with {nameof(batchSize)}:'{batchSize}', {nameof(shouldGetFirstVersion)}:'{shouldGetFirstVersion}', {nameof(orderByName)}:'{orderByName}'", this);
            var page = 1;

            while (true)
            {
                // Call the Search<T> method with the current page and chunk size.
                var searchResults = Search(query, page, batchSize, shouldGetFirstVersion, orderByName);
                // If there are no more results, break out of the loop.
                if (!searchResults.Hits.Any())
                {
                    yield break;
                }

                // Yield return the results in the current chunk.
                foreach (var hit in searchResults.Hits)
                {
                    yield return hit;
                }

                page++;
            }
        }

        public void Dispose()
        {
            // Dispose only IProviderSearchContext
            // Important! Never dispose search index
            Context.Dispose();
        }

        private ISearchIndex GetIndex(IDestinationSearchSettings settings)
        {
            if (settings == null)
            {
                return null;
            }

            logger.Debug($"Calling {nameof(GetIndex)} with {nameof(settings.IndexName)}:'{settings.IndexName}'", this);
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