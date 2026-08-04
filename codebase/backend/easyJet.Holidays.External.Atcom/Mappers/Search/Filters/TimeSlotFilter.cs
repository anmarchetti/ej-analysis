using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.External.Atcom.Models.Extensions;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Time slot filter
    /// </summary>
    public class TimeSlotFilter : IFilter
    {
        private readonly IReferenceDataService _referenceDataService;

        public TimeSlotFilter(IReferenceDataService referenceDataService)
        {
            _referenceDataService = referenceDataService;
        }

        /// <summary>
        /// Filter offers by outbound and inbound time slots 
        /// </summary>
        /// <param name="originalSet"></param>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            // Dont need filter by time slots. It is already filtered.
            return originalSet;
        }

        /// <summary>
        /// calculate filter options and all possible results for TimeSlot filter
        /// </summary>
        /// <param name="offers"></param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            if (offers == null || !offers.Any())
            {
                return FilterOptions.Empty;
            }

            var flightFilters = await _referenceDataService.GetFlightFilters();

            if (flightFilters == null)
            {
                return FilterOptions.Empty;
            }

            var filterPillsConfig = await _referenceDataService.GetFilterPillsConfig();

            var options = flightFilters.Select(x => new FilterOption
            {
                Name = x.Name,
                Count = 1,  // we can't show count on UI, that's why we return hard - coded 1 to show available filter
                Children = x.TimeSlots.Select(y => new FilterOption
                {
                    Code = y.Code,
                    AtcomCode = y.AtcomCode,
                    Name = y.Name,
                    FullName = filterPillsConfig.GetFilterPillFullName(Holidays.Api.Domain.Data.Filters.AvailableFilters.TimeSlot, $"{x.Name}|{y.Code}"),
                    Count = 1,       // we can't show count on UI, that's why we return hard - coded 1 to show available filter
                    StartTime = y.StartTime,
                    EndTime = y.EndTime,
                    TrackingId = y.TrackingId
                }).ToList()
            }).ToList();

            return new FilterOptions
            {
                Options = options
            };
        }
    }
}
