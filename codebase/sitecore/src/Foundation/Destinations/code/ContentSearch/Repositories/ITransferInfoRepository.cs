using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using Sitecore.ContentSearch.Linq;

namespace easyJet.Foundation.Destinations.ContentSearch.Repositories
{
    public interface ITransferInfoRepository
    {
        /// <summary>
        /// Get transfers by transferInfoItem ids.
        /// </summary>
        /// <param name="productIds">TransferInfoProductIds.</param>
        /// <returns>Returns transfers info.</returns>
        SearchResults<BaseTransferInfoSearchResultItem> GetTransfersByProductIds(IEnumerable<string> productIds);

        /// <summary>
        /// Gets all transfers as a dictionary mapping ProductId to Duration.
        /// </summary>
        /// <returns>Dictionary with ProductId as key and Duration as value.</returns>
        Dictionary<string, int> GetAllTransferDurations();
    }
}