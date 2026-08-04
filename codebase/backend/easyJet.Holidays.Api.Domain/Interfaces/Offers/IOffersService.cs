using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Interfaces.Offers
{
    /// <summary>
    /// Packages availability service
    /// </summary>
    public interface IOffersService
    {
        /// <summary>
        /// Search available offers by specified query string params
        /// </summary>
        /// <param name="request">Query string parameters followed by '?'</param>
        /// <param name="ignoreFilters">Ignore filters build</param>
        /// <returns>Search response JSON string</returns>
        Task<SearchOffersResponse> Search(PackagesSearchRequest request, bool ignoreFilters = false);

        /// <summary>
        /// Search available offers by specified query string params, but:
        /// - No filtering (all results will be returned)
        /// - No CMS/facilities/filter data
        /// - Only plain Atcom results
        /// </summary>
        /// <param name="request">Query string parameters followed by '?'</param>
        /// <returns>Search response JSON string</returns>
        Task<SearchOffersResponse> SearchWithoutDetails(PackagesSearchRequest request);

        /// <summary>
        /// Search recommended offer for user dearch
        /// Will be used SmartSeer api to get recommendations
        /// </summary>
        /// <param name="request">Search request</param>
        /// <returns></returns>
        Task<SearchOffersResponse> SearchRecommendedOffers(RecommendedSearchRequest request);

        /// <summary>
        /// Search packages and apply filters. Filter options are not generated, doesn't support sorting or pagination. 
        /// </summary>
        /// <param name="request">Request data</param>
        /// <returns>Filtered client result</returns>
        Task<SearchOffersResponse> SearchWithFilters(PackagesSearchRequest request);
    }
}