using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// DepartureAirport filter
    /// </summary>
    public class DepartureAirportFilter : IFilter
    {
        private readonly AtcomSettings _atcomSettings;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IRouteAvailabilityService _routeAvailabilityService;
        private readonly IMarketService _marketService;

        public DepartureAirportFilter(
            IOptions<AtcomSettings> atcomSettings,
            IRouteAvailabilityService routeAvailabilityService,
            IReferenceDataService referenceDataService,
            IMarketService marketService
            )
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _routeAvailabilityService = routeAvailabilityService;
            _referenceDataService = referenceDataService;
            _marketService = marketService;
        }

        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            // Dont need filter by departure airport. It already filtered.
            return originalSet;
        }

        /// <summary>
        /// calculate filter options and all possible results for departure airport filter
        /// </summary>
        /// <param name="offers"></param>
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            var originalDepartures = (request.DepartureAirport ?? request.Departure ?? string.Empty)
                 .Replace(" ", string.Empty)
                 .Split(',');

            // Frontent passing geograpfy in format ES,EU|EURS|EDSA
            var geo = ParseGeographyField(request.Geography);

            if (request.Geography == _atcomSettings.AnywhereCode)
            {
                // Update geography. For the cases when should return all availability.
                var countries = await _referenceDataService.GetAllDestinations(true);
                if (countries != null)
                {
                    geo = string.Join(",", countries.Select(x => x.Code));
                }
            }

            var startDate = DateFormatUtils.Parse(request.StartDate).DateTime;
            var availalbility = new string[0];

            if (request.EndDate != null)
            {
                // case with fixed duration.
                DateTime endDate = DateFormatUtils.Parse(request.EndDate).DateTime;
                var departures = originalDepartures.Contains(_atcomSettings.AnywhereCode) ? null : string.Join(",", originalDepartures);
                availalbility = await _routeAvailabilityService.GetDepartureAvailability(geo, departures, request.FlexibleDays, startDate, endDate, request.Duration?.FirstOrDefault() ?? 0, request.PromoPageId);
            }
            else
            {
                // case with fixed start date
                DateTime? endDate = DateFormatUtils.Parse(request.StartDate).DateTime.AddDays(request.Duration?.FirstOrDefault() ?? 0);
                availalbility = await _routeAvailabilityService.GetDepartureAvailability(geo, request.FlexibleDays, startDate, endDate, request.Duration?.FirstOrDefault(), request.PromoPageId);
            }


            // If departure airports contains "ALL" airports     
            if (originalDepartures.Contains(_atcomSettings.AnywhereCode))
            {
                // take all available departure airports, we can't take everything, because  it may also contain destination aiports (routes file contains both directions)
                var allDepartureAirports = _marketService.GetCurrentMarket()?.AirportDepartureCodes;
                originalDepartures = allDepartureAirports.ToArray();
            }

            var airports = await _referenceDataService.GetAirports();

            var options = originalDepartures.Select(airport =>
            {
                var airportData = airports.GetValueOrDefault(airport);
                return new FilterOption
                {
                    Code = airport,
                    Name = airportData?.Name,
                    TrackingId = airportData?.TrackingId,
                    Count = availalbility.Any(x => x == airport) ? 1 : 0
                };
            }).ToList();

            return new FilterOptions
            {
                Options = options
            };
        }

        /// <summary>
        /// Parse geography value 
        /// Geography value: ES|IT,ESRE|ITPS
        /// Will return exact destination value, without any additional info.
        /// </summary>
        /// <param name="geog"></param>
        /// <returns></returns>
        public static string ParseGeographyField(string geog)
        {
            var geogParts = geog?.Split(',');
            if (geogParts?.Length > 1)
            {
                // Return full geography if no reguion specified
                var secondGeoPart = geogParts[1]?.Replace('|', ',');

                if (geogParts.Length == 3)
                {
                    secondGeoPart = ReplaceDestinations(secondGeoPart, geogParts[2]);
                }

                return secondGeoPart;
            }
            if (geogParts?.Length == 1)
            {
                // Returns only resorts if contains them in request string.
                return geogParts[0]?.Replace('|', ',');
            }
            return string.Empty;
        }

        /// <summary>
        /// Replaces the destinations.
        /// </summary>
        /// <param name="secondGeoPart">The second geo part.</param>
        /// <param name="thirdGeoPart">The third geo part.</param>
        /// <returns>A string.</returns>
        private static string ReplaceDestinations(string secondGeoPart, string thirdGeoPart)
        {
            var secondGeoPartSplit = secondGeoPart?.Split(',').ToList();
            var thirdGeoPartSplit = thirdGeoPart?.Split('|').ToList();

            for (int i = 0; i < secondGeoPartSplit?.Count; i++)
            {
                var destinationsToReplace = thirdGeoPartSplit?.Where(x => x.StartsWith(secondGeoPartSplit[i], StringComparison.OrdinalIgnoreCase)).ToList();
                if (destinationsToReplace != null && destinationsToReplace.Count != 0)
                {
                    var destinations = string.Join(",", destinationsToReplace);
                    secondGeoPartSplit[i] = destinations;
                }
            }
            secondGeoPart = string.Join(",", secondGeoPartSplit ?? Enumerable.Empty<string>());
            return secondGeoPart;
        }
    }
}
