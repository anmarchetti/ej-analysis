using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Abstractions;
using Sitecore.ContentSearch.Maintenance;
using Sitecore.ContentSearch.Maintenance.Strategies;
using Sitecore.ContentSearch.Security;
using Sitecore.ContentSearch.Sharding;
using LinqShardingStrategy = Sitecore.ContentSearch.Linq.Common.IShardingStrategy;

namespace easyJet.Foundation.Testing.ContentSearch
{
    [ExcludeFromCodeCoverage]
    public class FakeSearchIndex : ISearchIndex
    {
        private readonly IProviderSearchContext context;

        public FakeSearchIndex(IProviderSearchContext context, ProviderIndexConfiguration providerIndexConfiguration, string indexName)
        {
            this.context = context;
            Name = indexName;
            Configuration = providerIndexConfiguration;
        }

        public string Name { get; }

        public ISearchIndexSummary Summary { get; }

        public ISearchIndexSchema Schema { get; set; }

        public IIndexPropertyStore PropertyStore { get; set; }

        public IndexGroup Group { get; }

        public AbstractFieldNameTranslator FieldNameTranslator { get; set; }

        public ProviderIndexConfiguration Configuration { get; set; }

        public IIndexOperations Operations { get; }

        public IndexingState IndexingState { get; }

        public IList<IProviderCrawler> Crawlers { get; }

        public IObjectLocator Locator { get; }

        public bool IsSharded { get; }

        public bool EnableItemLanguageFallback { get; set; }

        public bool EnableFieldLanguageFallback { get; set; }

        public LinqShardingStrategy ShardingStrategy { get; set; }

        public IShardFactory ShardFactory { get; }

        public IEnumerable<Shard> Shards { get; }

        public IEnumerable<IIndexUpdateStrategy> UpdateStrategies { get; set; }

        IShardingStrategy ISearchIndex.ShardingStrategy { get; set; }

        IShardFactory ISearchIndex.ShardFactory { get; }

        IEnumerable<Shard> ISearchIndex.Shards { get; }

        IObjectLocator ISearchIndex.Locator => throw new NotImplementedException();

        IEnumerable<IIndexUpdateStrategy> ISearchIndex.UpdateStrategies => throw new NotImplementedException();

        public void AddCrawler(IProviderCrawler crawler)
        {
        }

        public void AddCrawler(IProviderCrawler crawler, bool initializeCrawler)
        {
        }

        public void AddStrategy(IIndexUpdateStrategy strategy)
        {
        }

        public IProviderDeleteContext CreateDeleteContext()
        {
            return null;
        }

        public IProviderSearchContext CreateSearchContext(SearchSecurityOptions options = SearchSecurityOptions.Default)
        {
            return context;
        }

        public IProviderUpdateContext CreateUpdateContext()
        {
            return null;
        }

        public void Delete(IIndexableId indexableId)
        {
        }

        public void Delete(IIndexableId indexableId, IndexingOptions indexingOptions)
        {
        }

        public void Delete(IIndexableUniqueId indexableUniqueId)
        {
        }

        public void Delete(IIndexableUniqueId indexableUniqueId, IndexingOptions indexingOptions)
        {
        }

        public void Dispose()
        {
        }

        public IReadOnlyCollection<IIndexableUniqueId> GetIndexingDependencies(IIndexable indexable)
        {
            throw new NotImplementedException();
        }

        public void Initialize()
        {
        }

        public void PauseIndexing()
        {
        }

        public void Rebuild()
        {
        }

        public void Rebuild(IndexingOptions indexingOptions)
        {
        }

        public Task RebuildAsync(IndexingOptions indexingOptions, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public void Refresh()
        {
        }

        public void Refresh(IIndexable indexableStartingPoint)
        {
        }

        public void Refresh(IIndexable indexableStartingPoint, IndexingOptions indexingOptions)
        {
        }

        public Task RefreshAsync(IIndexable indexableStartingPoint, IndexingOptions indexingOptions, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }

        public void RemoveAllCrawlers()
        {
        }

        public bool RemoveCrawler(IProviderCrawler crawler)
        {
            return true;
        }

        public void Reset()
        {
        }

        public void ResumeIndexing()
        {
        }

        public void StopIndexing()
        {
        }

        public void Update(IIndexableUniqueId indexableUniqueId)
        {
        }

        public void Update(IIndexableUniqueId indexableUniqueId, IndexingOptions indexingOptions)
        {
        }

        public void Update(IEnumerable<IIndexableUniqueId> indexableUniqueIds)
        {
        }

        public void Update(IEnumerable<IIndexableUniqueId> indexableUniqueIds, IndexingOptions indexingOptions)
        {
        }

        public void Update(IEnumerable<IndexableInfo> indexableInfo)
        {
        }

        public void UpdateDependents(IProviderUpdateContext context, IIndexable indexable)
        {
            throw new NotImplementedException();
        }
    }
}
