using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;

namespace easyJet.Foundation.Destinations.Services
{
    [Service(typeof(ITransfersInfoSearchService), Lifetime = Lifetime.Transient)]
    public class TransfersInfoSearchService : ITransfersInfoSearchService
    {
        private readonly ITransferInfoRepository transferInfoRepository;

        public TransfersInfoSearchService(ITransferInfoRepository transferInfoRepository)
        {
            this.transferInfoRepository = transferInfoRepository;
        }

        /// <summary>
        /// Async get data from Solr by transferInfo productIds.
        /// </summary>
        /// <param name="productIds">ProductIds used for searching.</param>
        /// <param name="sizeOfSubset">Size of subset.</param>
        /// <returns>Returns founded items.</returns>
        public async Task<IEnumerable<BaseTransferInfoSearchResultItem>> GetTransfersInfoByProductIds(IEnumerable<string> productIds, int sizeOfSubset)
        {
            var results = new ConcurrentBag<IEnumerable<BaseTransferInfoSearchResultItem>>();

            var actions = new ActionBlock<IEnumerable<string>>(async ids =>
            {
                var subset = await Task.Run(() => transferInfoRepository.GetTransfersByProductIds(ids));
                results.Add(subset.Hits.Select(x => x.Document));
            });

            for (int i = 0; i < productIds.Count(); i += sizeOfSubset)
            {
                var ids = productIds.Skip(i).Take(sizeOfSubset).ToArray();
                await actions.SendAsync(ids);
            }

            actions.Complete();
            await actions.Completion;

            return results.SelectMany(x => x);
        }
    }
}