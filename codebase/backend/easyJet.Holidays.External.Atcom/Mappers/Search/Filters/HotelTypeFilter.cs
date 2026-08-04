using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Filters holidays based on holiday type (which comes from sitecore based on facility matrix)
    /// </summary>
    public class HotelTypeFilter : IFilter, IFilterOptionCount
    {
        private readonly IReferenceDataService _referenceDataService;

        /// <summary>
        /// Constructor for Hotel Type Filter.
        /// </summary>
        /// <param name="referenceDataService">Reference data service.</param>
        public HotelTypeFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <inheritdoc />
        public Task Count(IList<AvCacheResultOffersOfferExtended> offers, FilterOptions filterOptions, PackagesSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(filterOptions);
            ArgumentNullException.ThrowIfNull(offers);

            foreach (var opt in filterOptions.Options)
            {
                opt.Count = offers.Count(x => x.Accommodation.FacilityMatrix is not null && Array.Exists(x.Accommodation.FacilityMatrix, y => y.Code == opt.Code));
            }

            return Task.CompletedTask;
        }

        public Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request)
        {
            if (string.IsNullOrEmpty(request.HotelTypes))
            {
                return Task.FromResult<List<AvCacheResultOffersOfferExtended>>(offers);
            }

            var hotelTypes = HotelThemeService.GetHotelTypes(request.HotelTypes);
            var filteredOffers = offers.Where(x => hotelTypes.Any(t => x.Accommodation.FacilityMatrix is not null && x.Accommodation.FacilityMatrix.Any(m => m.Code == t))).ToList();
            return Task.FromResult<List<AvCacheResultOffersOfferExtended>>(filteredOffers);
        }

        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            if (offers.IsNullOrEmpty())
            {
                return FilterOptions.Empty;
            }

            var filteredOffers = await applyAllOtherFilters(offers, request);

            var hotelTypes = await _referenceDataService.GetFacilityMatrixConfiguration();
            var offersHotelTypes = hotelTypes
                .Where(i => filteredOffers.Exists(f => f.Accommodation.FacilityMatrix is not null && Array.Exists(f.Accommodation.FacilityMatrix, x => x.Code.Equals(i.Code, StringComparison.OrdinalIgnoreCase))));

            var options = offersHotelTypes.Select(hotelType =>
            {
                return new FilterOption
                {
                    Code = hotelType.Code,
                    Name = hotelType.Name,
                    TrackingId = hotelType.TrackingId,
                    Icon = hotelType.Icon,
                    TooltipText = hotelType.TooltipText,
                    IsExclusive = hotelType.IsExclusive ? true : null
                };
            }).ToList();

            return new FilterOptions
            {
                Options = options
            };
        }
    }
}
