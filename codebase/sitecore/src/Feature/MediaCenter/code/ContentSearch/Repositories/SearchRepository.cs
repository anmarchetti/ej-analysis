using System;
using System.Linq;
using easyJet.Feature.MediaCenter.ContentSearch.Settings;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BasePredicates;
using easyJet.Foundation.SitecoreExtensions.ContentSearch.BaseSearchTypes;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;
using Sitecore.Data;
using Sitecore.Diagnostics;

namespace easyJet.Feature.MediaCenter.ContentSearch.Repositories
{
    public class SearchRepository : ISearchRepository
    {
        protected IProviderSearchContext Context { get; set; }

        private readonly ISearchSettings indexSettings;

        protected SearchRepository(ISearchSettings indexSettings)
        {
            this.indexSettings = indexSettings;
            Context = GetContext();
        }

        /// <inheritdoc/>
        public SearchResults<T> Search<T>(IQueryable<T> query, int page = 1, int take = 0, int offset = 0)
            where T : BaseSearchResultItem
        {
            var baseQuery = PredicateBuilder.True<T>();

            baseQuery = baseQuery.MatchContextLanguage();
            baseQuery = baseQuery.IsLatestVersion();

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
        /// Get search context.
        /// </summary>
        /// <param name="database">Sitecore database.</param>
        /// <returns>Search context.</returns>
        protected IProviderSearchContext GetContext(Database database = null)
        {
            var settings = indexSettings.BuildSettings(database);
            var index = GetIndex(settings);
            return index?.CreateSearchContext();
        }

        /// <summary>
        /// Returns index for current database if we cannot recive index then we use default index.
        /// </summary>
        /// <param name="settings">Settings for index: default indexname and indexname.</param>
        /// <returns>Search index or index by default.</returns>
        private ISearchIndex GetIndex(ISearchSettings settings)
        {
            ISearchIndex searchIndex = null;
            try
            {
                searchIndex = ContentSearchManager.GetIndex(settings.IndexName);
                Log.Debug($"Index with {settings.IndexName} created.", this);
            }
            catch (Exception)
            {
                Log.Info($"Could not resolve index by name {settings.IndexName}.", this);
                try
                {
                    searchIndex = ContentSearchManager.GetIndex(settings.DefaultIndexName);
                    Log.Debug($"Index with {settings.DefaultIndexName} created.", this);
                }
                catch (Exception)
                {
                    Log.Error($"Could not resolve index by name {settings.DefaultIndexName}.", this);
                }
            }

            return searchIndex;
        }
    }
}