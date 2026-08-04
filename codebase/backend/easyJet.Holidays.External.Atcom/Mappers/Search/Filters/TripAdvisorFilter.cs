using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// TripAdvisor filter
    /// </summary>
    public class TripAdvisorFilter : IFilter
    {
        /// <summary>
        /// Service used to retrieve reference data for recommended options.
        /// </summary>
        private readonly IReferenceDataService _referenceDataService;

        /// <summary>
        /// Initializes a new instance of the <see cref="TripAdvisorFilter"/> class.
        /// </summary>
        /// <param name="referenceDataService">Reference data service dependency.</param>
        public TripAdvisorFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Filter offers by accommodation trip advisor rating like OR condition
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            if (request.TripAdvisorRating > 0)
            {
                originalSet = originalSet.Where(offer =>
                    offer.Accom != null && offer.Accom.Any(accom => accom.TripAdvisorRating >= request.TripAdvisorRating && accom.TripAdvisorRating <= 5)
                ).ToList();
            }

            return originalSet;
        }

        /// <summary>
        /// calculate filter options and all possible results for Star Rating filter
        /// </summary>
        /// <param name="offers"></param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            ArgumentNullException.ThrowIfNull(applyAllOtherFilters);

            if (offers == null || !offers.Any())
            {
                return FilterOptions.Empty;
            }

            var filteredOffers = await applyAllOtherFilters(offers, request);

            var filterPillsConfig = await _referenceDataService.GetFilterPillsConfig();

            // do not display hotels without rating on purpose
            var options = new[] { 1, 2, 3, 4, 5 }
                .Select(r => new FilterOption
                {
                    Code = r.ToString(CultureInfo.InvariantCulture),
                    Name = r.ToString(CultureInfo.InvariantCulture),
                    FullName = filterPillsConfig.GetFilterPillFullName(Holidays.Api.Domain.Data.Filters.AvailableFilters.TripadvisorRating, r.ToString(CultureInfo.InvariantCulture)),
                    Count = GetNumberOfResultsByTripAdvisorRating(filteredOffers, r)
                })
                .ToList();

            return new FilterOptions
            {
                Options = options
            };
        }

        /// <summary>
        /// Calculate number of results for given Board Type.
        /// Takes into account Unit Board and AltBoard of accommodation
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="tripAdvisorRating">TripAdvisor rating</param>
        /// <returns></returns>
        private int GetNumberOfResultsByTripAdvisorRating(IEnumerable<AvCacheResultOffersOfferExtended> offers, int tripAdvisorRating)
        {
            return (offers == null || !offers.Any()) ?
                0 :
                offers.Where(offer =>
                    offer.Accom != null && offer.Accom.Any(accom => accom.TripAdvisorRating >= tripAdvisorRating && accom.TripAdvisorRating <= 5)
                ).Count();
        }
    }
}
