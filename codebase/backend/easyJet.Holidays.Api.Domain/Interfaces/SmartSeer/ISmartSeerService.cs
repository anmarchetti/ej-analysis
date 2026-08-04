using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;

namespace easyJet.Holidays.Api.Domain.Interfaces.SmartSeer
{
    /// <summary>
    /// Availalbe SmartSeer functions
    /// </summary>
    public interface ISmartSeerService
    {
        /// <summary>
        /// Get sorted response form SmartSeer api with tracking info.
        /// </summary>
        /// <param name="hotelIds">Hotels IDs to sort</param>
        /// <param name="searchRequest">search request</param>
        /// <param name="sortingEnabled">search request</param>
        /// <returns></returns>
        Task<SmartSeerSortedBody> GetSortedHotelCodes(IEnumerable<string> hotelIds, PackagesSearchRequest searchRequest, bool sortingEnabled = false);

        /// <summary>
        /// Get recommended hotel IDs with traccking information. 
        /// Request should contains specific user cookie to request results.
        /// </summary>
        /// <param name="searchRequest">search request</param>
        /// <returns></returns>
        Task<SmartSeerSortedBody> GetHotelsRecomendations(RecommendedSearchRequest searchRequest);

        /// <summary>
        /// Get destinations recommendation
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<SmartSeerRecommendations> GetRecommendedDestinations(DestinationsRecommendationRequest request);
    }
}
