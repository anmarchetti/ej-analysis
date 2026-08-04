using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using System.Globalization;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Star rating filter
    /// </summary>
    public class StarRatingFilter : IFilter
    {
        /// <summary>
        /// Service used to retrieve reference data for filter pill options.
        /// </summary>
        private readonly IReferenceDataService _referenceDataService;

        /// <summary>
        /// Initializes a new instance of the <see cref="StarRatingFilter"/> class.
        /// </summary>
        /// <param name="referenceDataService">Reference data service dependency.</param>
        public StarRatingFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Filter offers by accommodation star rating like OR condition
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            if (!string.IsNullOrWhiteSpace(request.StarRating))
            {
                var ratings = request.StarRating.ToUpperInvariant().Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(f =>
                {
                    int.TryParse(f.Trim(), out int rating);
                    return rating;
                });

                originalSet = originalSet.Where(offer =>
                    offer.Accom != null && offer.Accom.Any(accom => ratings.Contains(accom.StarRating))
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
                    FullName = filterPillsConfig.GetFilterPillFullName(Holidays.Api.Domain.Data.Filters.AvailableFilters.StarRating, r.ToString(CultureInfo.InvariantCulture)),
                    Count = GetNumberOfResultsByStarRating(filteredOffers, r)
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
        /// <param name="starRating"></param>
        /// <returns></returns>
        private static int GetNumberOfResultsByStarRating(IEnumerable<AvCacheResultOffersOfferExtended> offers, int starRating)
        {
            return (offers == null || !offers.Any()) ?
                0 :
                offers.Where(offer =>
                    offer.Accom != null && offer.Accom.Any(accom => accom.StarRating == starRating)
                ).Count();
        }
    }
}
