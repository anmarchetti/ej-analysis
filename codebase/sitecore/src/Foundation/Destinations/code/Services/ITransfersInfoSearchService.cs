using System.Collections.Generic;
using System.Threading.Tasks;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;

namespace easyJet.Foundation.Destinations.Services
{
    public interface ITransfersInfoSearchService
    {
        Task<IEnumerable<BaseTransferInfoSearchResultItem>> GetTransfersInfoByProductIds(IEnumerable<string> productIds, int sizeOfSubset);
    }
}