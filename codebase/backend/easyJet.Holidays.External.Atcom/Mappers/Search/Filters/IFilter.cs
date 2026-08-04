using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    public interface IFilter
    {
        /// <summary>
        /// Get all available options for filter
        /// </summary>
        /// <param name="offers">Collection of offers</param>
        /// <param name="request">Request model</param>
        /// <param name="applyAllOtherFilters">Function to apply all other filters </param>
        /// <returns>Collection of filter options</returns>
        Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters);

        /// <summary>
        /// Do filter logic
        /// </summary>
        /// <param name="offers">Collection of offers to filter</param>
        /// <param name="request">Request model</param>
        /// <returns>Filtered set</returns>
        Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request);
    }

    /// <summary>
    /// Delegate for filtering offers
    /// </summary>
    /// <param name="originalSet"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    public delegate Task<List<AvCacheResultOffersOfferExtended>> ApplyAllFiltersFunc(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request);


    /// <summary>
    /// Interface for counting filter options.
    /// </summary>
    public interface IFilterOptionCount
    {
        /// <summary>
        /// Counts the filter options based on the provided offers and request.
        /// </summary>
        /// <param name="offers">Collection of offers.</param>
        /// <param name="filterOptions">Filter options to count.</param>
        /// <param name="request">Request model.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        Task Count(IList<AvCacheResultOffersOfferExtended> offers, FilterOptions filterOptions, PackagesSearchRequest request);
    }
}
