using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Diration filter
    /// </summary>
    public class DurationFilter : IFilter
    {
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly SearchSettings _searchSettings;

        public DurationFilter(
            IRouteAvailabilityService routeAvailabilityService,
            IOptions<SearchSettings> searchSettings
            )
        {
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _routeAvailabilityService = routeAvailabilityService;
        }

        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            // Dont need filter by departure airport. It already filtered in response
            return originalSet;
        }

        /// <summary>
        /// Will return formated duration filters based on route availability.
        /// </summary>
        /// <param name="request">Search request</param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            var startDate = DateFormatUtils.Parse(request.StartDate).DateTime;
            var endDate = startDate.AddDays(_searchSettings.MaximumHolidayDuration);
            Dictionary<string, bool> av = new Dictionary<string, bool>();

            if (request.FlexibleDays != 0)
            {
                // Flexible days should include -3 days in the beginig and +3 days in the end of the range.
                startDate = startDate.AddDays(-request.FlexibleDays);
                endDate = endDate.AddDays(request.FlexibleDays);
            }

            // Get fligths availabilty for the needed range.
            var availalbility = await _routeAvailabilityService.GetAvailabilityDates(
                request.Departure,
                DepartureAirportFilter.ParseGeographyField(request.Geography),
                startDate,
                endDate);

            // If FlexibleDays is set then need to check availabilty for the range (startDate - x -> satrtDate + x ) in general case only one day will be selected.
            var numberDaysToCheck = (request.FlexibleDays is 0 ? 0 : request.FlexibleDays * 2) + 1;
            // Only days with availabe outbound flights needed.
            var flexibleAvailability = availalbility.Dates?.Take(numberDaysToCheck).Where(x => x.Out).ToList();

            flexibleAvailability?.ForEach(avs =>
            {
                availalbility.Dates.ForEach(x =>
                {
                    var outboundDate = DateFormatUtils.Parse(avs.Date).UtcDateTime;
                    var inboundDate = DateFormatUtils.Parse(x.Date).UtcDateTime;
                    if (inboundDate > outboundDate)
                    {
                        // Process function only if inbound date is in future
                        var code = ((inboundDate - outboundDate).TotalDays).ToString();
                        if (av.TryGetValue(code, out bool val))
                        {
                            av[code] = val ? val : x.In;
                        }
                        else
                        {
                            av[code] = x.In;
                        }
                    }
                });
            });

            var options = av.Take(_searchSettings.MaximumHolidayDuration).Select(x => new FilterOption
            {
                Code = x.Key,
                Count = x.Value ? 1 : 0,
            }).ToList();

            return new FilterOptions
            {
                Options = options
            };
        }
    }
}
