using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyJet.Foundation.Destinations.ContentSearch.Settings;
using Sitecore.ContentSearch;
using Sitecore.ContentSearch.Linq;
using Sitecore.ContentSearch.Linq.Utilities;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    [Service(typeof(ITransferInfoRepository), Lifetime = Lifetime.Transient)]
    public class TransferInfoRepository : BaseTransferInfoRepository, ITransferInfoRepository
    {
        private readonly ITransferInfoSearchSettings settings;

        public TransferInfoRepository(ITransferInfoSearchSettings indexSettings)
            : base(indexSettings)
        {
            settings = indexSettings;
        }

        /// <inheritdoc/>
        public SearchResults<BaseTransferInfoSearchResultItem> GetTransfersByProductIds(IEnumerable<string> productIds)
        {
            var query = Context.GetQueryable<BaseTransferInfoSearchResultItem>()
                .Where(item => item.IsLatestVersion)
                .Where(item => item.TemplateId == Constants.TemplateIds.TransferInfo);

            var predicate = PredicateBuilder.True<BaseTransferInfoSearchResultItem>();

            foreach (var productId in productIds)
            {
                predicate = predicate.Or(item => item.ProductId == productId);
            }

            predicate = predicate.And(item => item.Language == Sitecore.Context.Language.Name);

            query = query.Filter(predicate);

            return query.GetResults();
        }

        /// <inheritdoc/>
        public Dictionary<string, int> GetAllTransferDurations()
        {
            var result = new ConcurrentDictionary<string, int>();

            // Page size of 5000 is optimal for Solr request in this case: large enough
            // to minimize the number of round trips, but small enough to avoid memory
            // pressure and query timeouts
            var pageSize = 5000;

            // First get total count
            var countQuery = Context.GetQueryable<TransferInfoDurationResultItem>()
                .Where(item => item.IsLatestVersion)
                .Where(item => item.Language == Constants.TransferInfo.DefaultLanguage)
                .Where(item => item.Duration > 0)
                .Where(item => !string.IsNullOrEmpty(item.ProductId))
                .Take(0);
            var totalCount = countQuery.GetResults().TotalSearchResults;
            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

            // Process pages in parallel using a separate search context per iteration
            // MaxDegreeOfParallelism = 4 balances performance and server load:
            // enough concurrency to retrieve data quickly, but not so many simultaneous
            // requests that it overwhelms the Solr server
            Parallel.ForEach(Enumerable.Range(0, totalPages), new ParallelOptions { MaxDegreeOfParallelism = 4 }, page =>
            {
                var skip = page * pageSize;

                using (var searchContext = CreateSearchContext())
                {
                    var results = searchContext.GetQueryable<TransferInfoDurationResultItem>()
                        .Where(item => item.IsLatestVersion)
                        .Where(item => item.Language == Constants.TransferInfo.DefaultLanguage)
                        .Where(item => item.Duration > 0)
                        .Where(item => !string.IsNullOrEmpty(item.ProductId))
                        .Select(item => new TransferInfoDurationResultItem
                        {
                            ProductId = item.ProductId,
                            Duration = item.Duration
                        })
                        .Skip(skip)
                        .Take(pageSize)
                        .GetResults();

                    foreach (var document in results.Select(hit => hit.Document))
                    {
                        result.TryAdd(document.ProductId, document.Duration);
                    }
                }
            });

            return new Dictionary<string, int>(result);
        }

        private IProviderSearchContext CreateSearchContext()
        {
            return ContentSearchManager.GetIndex(settings.IndexName).CreateSearchContext();
        }
    }
}