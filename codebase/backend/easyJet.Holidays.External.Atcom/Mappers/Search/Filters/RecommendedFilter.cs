using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Provides recommended filter options.
    /// This filter does not alter the offer set.
    /// </summary>
    public class RecommendedFilter : IFilter
    {
        /// <summary>
        /// Service used to retrieve reference data for recommended options.
        /// </summary>
        private readonly IReferenceDataService _referenceDataService;

        /// <summary>
        /// Initializes a new instance of the <see cref="RecommendedFilter"/> class.
        /// </summary>
        /// <param name="referenceDataService">Reference data service dependency.</param>
        public RecommendedFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Returns offers unchanged because recommended is options-only.
        /// </summary>
        /// <param name="offers">Offers to keep unchanged.</param>
        /// <param name="request">Search request.</param>
        /// <returns>The original offers collection.</returns>
        public Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            return Task.FromResult(offers);
        }

        /// <summary>
        /// Returns recommended options.
        /// Current implementation uses temporary fake data.
        /// </summary>
        /// <param name="offers">Offers collection (not used in current implementation).</param>
        /// <param name="request">Search request.</param>
        /// <param name="applyAllOtherFilters">Delegate to apply all other filters (not used here).</param>
        /// <returns>A <see cref="FilterOptions"/> instance with recommended options.</returns>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            ArgumentNullException.ThrowIfNull(request);
            ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

            var filterPillsConfig = await _referenceDataService.GetFilterPillsConfig();
            var recommendedConfig = filterPillsConfig?.RecommendedFilterConfig;

            if (recommendedConfig?.Options == null || recommendedConfig.Options.Count == 0 ||
                (offers?.Count ?? 0) < recommendedConfig.MinNumberOfOffers)
            {
                return new FilterOptions
                {
                    Name = AvailableFilters.Recommended.GetEnumMemberValue(),
                    Options = []
                };
            }

            return new FilterOptions
            {
                Name = AvailableFilters.Recommended.GetEnumMemberValue(),
                Options = [.. recommendedConfig.Options.Select(option => new FilterOption
                {
                    FilterCode = option.FilterCode,
                    Code = option.Code,
                    Name = option.Name,
                })]
            };
        }
    }
}