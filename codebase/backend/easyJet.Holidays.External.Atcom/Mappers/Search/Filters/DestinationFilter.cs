using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Availability;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Extensions;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.Atcom.Tests")]
namespace easyJet.Holidays.External.Atcom.Mappers.Search.Filters
{
    /// <summary>
    /// Destination filter
    /// </summary>
    public class DestinationFilter : IFilter
    {
        private readonly AtcomSettings _atcomSettings;
        private readonly IDestinationsService _destinationsService;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IRouteAvailabilityService _routeAvailabilityService;

        public const string DestinationVariantFilterName = "destination";
        public const string RegionVariantFilterName = "region";

        public DestinationFilter(
            IOptions<AtcomSettings> atcomSettings,
            IDestinationsService destinationsService,
            IReferenceDataService referenceDataService,
            IRouteAvailabilityService routeAvailabilityService
            )
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _referenceDataService = referenceDataService;
            _destinationsService = destinationsService;
            _routeAvailabilityService = routeAvailabilityService;
        }

        /// <inheritdoc/>
        public async Task<List<AvCacheResultOffersOfferExtended>> FilterBy(List<AvCacheResultOffersOfferExtended> originalSet, PackagesSearchRequest request)
        {
            // AtcomCodes, geography should not be null and Geography should not be "ALL"
            if (!string.IsNullOrEmpty(request.Geography) && !string.IsNullOrEmpty(request.AccomCodes) && request.Geography != _atcomSettings.AnywhereCode)
            {
                // Split country codes and regions
                var splitByType = request?.Geography?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                if (splitByType?.Length <= 0)
                {
                    return originalSet;
                }
                // Split country codes
                var countriesSplit = splitByType?[0].Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
                var destinationsToFilter = countriesSplit;
                if (splitByType?.Length > 1)
                {
                    // Split regions
                    destinationsToFilter = splitByType[1].Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (string code in countriesSplit)
                    {
                        // Add country code to filtered codes if code is missing from regions(can be a case if all country is selected)
                        if (!destinationsToFilter.Any(y => y.StartsWith(code)))
                        {
                            destinationsToFilter = destinationsToFilter.Concat(new[] { code }).ToArray();
                        }
                    }
                }

                // Get hotels location by atcom code
                var accomCodes = request.AccomCodes?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                var destinations = (await _destinationsService.GetDestinationsByCodes(accomCodes, true))
                    .Where(x => x.Type != DestinationItemType.VirtualCountry
                        && x.Type != DestinationItemType.VirtualRegion
                        && x.Type != DestinationItemType.VirtualResort);

                // Filter atcom codes by geography
                var filteredAtcomCodes = destinations.Where(x => x.Parents.Any(y => destinationsToFilter.Contains(y.Code))).Select(x => x.Code);
                return originalSet.Where(x => filteredAtcomCodes.Contains(x.Accom?.FirstOrDefault()?.Code)).ToList();
            }

            return originalSet;
        }

        /// <summary>
        /// Calculate filter options and all possible results for Destination filter.
        /// It's based on request countries, doesn't take into account atcom results
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="request"></param>
        /// <param name="applyAllOtherFilters"></param>
        /// ]'
        public async Task<FilterOptions> GetOptions(List<AvCacheResultOffersOfferExtended> offers, PackagesSearchRequest request, ApplyAllFiltersFunc applyAllOtherFilters)
        {
            if (request.Departure == "ALL")
            {
                request.Departure = null;
            }

            ExtractDatesFromRequest(request, out var startDate, out var endDate, out var duration);

            if (IsPromoPageRequest(request))
            {
                return await GetPromoPageFilters(request, startDate, endDate, duration);
            }

            return await GetGeneralFilters(request, startDate, endDate, duration);
        }

        private async Task<FilterOptions> GetPromoPageFilters(PackagesSearchRequest request, DateTime? startDate, DateTime? endDate, int? duration)
        {
            var destinationItems = (await _destinationsService.GetPromoDestinations(request.PromoPageId)).ToList();
            var allDestinations = await _referenceDataService.GetAllDestinations(false);
            var availableDestinationCodesByRoute = await GetAvailableDestinationCodesByRoute(request, startDate, endDate, duration);

            if (destinationItems.Count == 0)
            {
                var options = allDestinations.Select(destination => GetFilterOption(destination, destination.Children, null, availableDestinationCodesByRoute)).ToList();
                return new FilterOptions
                {
                    Name = DestinationVariantFilterName,
                    Options = options
                };
            }

            var (countryCodes, regionCodes, resortCodes) = GeographyParseUtils.SplitGeographyByDestinations(destinationItems);

            var virtualRegionCodeCountryCodeMapping = GetVirtualRegionCodeCountryCodeMapping(allDestinations);

            if (ShouldShowResorts(_atcomSettings.AnywhereCode, countryCodes, regionCodes, resortCodes))
            {
                //We need this mapping to resolve relatedRegions for virtual regions, resorts
                var allRegions = BuildCodeDestinationMapping(allDestinations, DestinationItemType.Region);
                var allResorts = BuildCodeDestinationMapping(allDestinations, DestinationItemType.Resort);
                var regionResortMapping = GenerateRegionResortMapping(destinationItems, allRegions, allResorts);

                var options = MapFilterOptions(regionResortMapping, virtualRegionCodeCountryCodeMapping, availableDestinationCodesByRoute);
                return new FilterOptions
                {
                    Name = RegionVariantFilterName,
                    Options = options
                };
            }
            else
            {
                //We need this mapping to resolve relatedRegions for virtual countries
                var relatedRegionCodeVirtualCountryMapping = GetRelatedRegionCodeVirtualCountryMapping(allDestinations);
                var countryRegionMapping = GenerateCountryRegionMapping(destinationItems, relatedRegionCodeVirtualCountryMapping);

                var options = MapFilterOptions(countryRegionMapping, virtualRegionCodeCountryCodeMapping, availableDestinationCodesByRoute);
                return new FilterOptions
                {
                    Name = DestinationVariantFilterName,
                    Options = options
                };
            }
        }

        internal static List<FilterOption> MapFilterOptions(
            Dictionary<DestinationItem, List<DestinationItem>> childrenMapping,
            Dictionary<string, string> virtualRegionCodeCountryCodeMapping,
            HashSet<string> availableDestinationCodesByRoute)
        {
            return childrenMapping.Select(group => GetFilterOption(group.Key,
                group.Value.DistinctBy(i => i.Code).ToList(), virtualRegionCodeCountryCodeMapping, availableDestinationCodesByRoute)
            ).ToList();
        }

        internal static Dictionary<DestinationItem, List<DestinationItem>> GenerateCountryRegionMapping(
            List<DestinationItem> destinationItems, Dictionary<string, DestinationItem> relatedRegionCodeVirtualCountryMapping)
        {
            //Build up the country => region schema
            var destinationItemComparer = new DestinationItemComparer();
            return destinationItems
                .Select(destinationItem => new
                {
                    Country = GetCountryFromDestinationItem(destinationItem, relatedRegionCodeVirtualCountryMapping, out var isResortUnderVirtualCountry),
                    Regions = GetRegionsFromDestinationItem(destinationItem, isResortUnderVirtualCountry)
                })
                .Where(i => i.Country != null)
                .GroupBy(i => i.Country, destinationItemComparer)
                .ToDictionary(
                    i => i.Key,
                    i => i?.Where(a => a.Regions != null).SelectMany(a => a.Regions).ToList());
        }

        internal static Dictionary<DestinationItem, List<DestinationItem>> GenerateRegionResortMapping(
            List<DestinationItem> destinationItems,
            Dictionary<string, DestinationItem> allRegions,
            Dictionary<string, DestinationItem> allResorts)
        {
            //Build up the region => resort schema
            var destinationItemComparer = new DestinationItemComparer();
            return destinationItems
                .Where(destinationItem => destinationItem.Type is not DestinationItemType.Country or DestinationItemType.VirtualCountry)
                .Select(destinationItem => new
                {
                    Region = GetRegionFromDestinationItem(destinationItem),
                    Resorts = GetResortsFromDestinationItem(destinationItem, allRegions, allResorts)
                })
                .Where(i => i.Region != null)
                .GroupBy(i => i.Region, destinationItemComparer)
                .ToDictionary(
                    i => i.Key,
                    i => i?.Where(a => a.Resorts != null).SelectMany(a => a.Resorts).ToList());
        }

        internal static Dictionary<string, DestinationItem> GetRelatedRegionCodeVirtualCountryMapping(List<DestinationItem> allDestinations)
        {
            var allRegions = allDestinations
                .Where(i => i != null && i.Type == DestinationItemType.VirtualCountry && (i.RelatedRegions?.Any() ?? false))
                .SelectMany(i => i.RelatedRegions.Select(relatedRegion => new KeyValuePair<string, DestinationItem>(relatedRegion, i)))
                .ToDictionary(i => i.Key, i => i.Value);
            return allRegions;
        }

        internal static Dictionary<string, DestinationItem> BuildCodeDestinationMapping(List<DestinationItem> allDestinations, DestinationItemType destinationItemType)
        {
            return allDestinations
                .Where(country => country.Children != null)
                .SelectMany(country => country.Children)
                .Where(i => i != null && i.Type == destinationItemType)
                .ToDictionary(i => i.Code);
        }

        internal static Dictionary<string, string> GetVirtualRegionCodeCountryCodeMapping(List<DestinationItem> allDestinations)
        {
            return allDestinations
                .Where(country => country.Children != null)
                .SelectMany(country => country.Children.Select(region => new { region, countryCode = country.Code }))
                .Where(i => i.region.Type == DestinationItemType.VirtualRegion)
                .ToDictionary(i => i.region.Code, i => i.countryCode);
        }

        internal static List<DestinationItem> GetRegionsFromDestinationItem(DestinationItem destinationItem, bool isResortUnderVirtualCountry)
        {
            if (isResortUnderVirtualCountry)
                return new List<DestinationItem>(1) { destinationItem };

            if (destinationItem.Type == DestinationItemType.Region || destinationItem.Type == DestinationItemType.VirtualRegion)
                return new List<DestinationItem>(1) { destinationItem };

            if (destinationItem.Type == DestinationItemType.Country || destinationItem.Type == DestinationItemType.VirtualCountry)
                return destinationItem.Children;

            var regionDestinationItem = destinationItem.Parents?.FirstOrDefault(i => i.Type == DestinationItemType.Region || i.Type == DestinationItemType.VirtualRegion);

            if (regionDestinationItem == null)
                return new List<DestinationItem>(0);

            return new List<DestinationItem>(1) { regionDestinationItem };
        }

        internal static DestinationItem GetCountryFromDestinationItem(DestinationItem destinationItem, Dictionary<string, DestinationItem> relatedRegionCodeVirtualCountryMapping, out bool isResortUnderVirtualCountry)
        {
            isResortUnderVirtualCountry = false;
            if (destinationItem.Type == DestinationItemType.Country ||
                destinationItem.Type == DestinationItemType.VirtualCountry)
                return destinationItem;

            //Exception for resorts in virtual countries
            if (destinationItem.Type == DestinationItemType.Resort)
            {
                var region = GetRegion(destinationItem);
                if (region != null && relatedRegionCodeVirtualCountryMapping.ContainsKey(region.Code))
                {
                    isResortUnderVirtualCountry = true;
                    return relatedRegionCodeVirtualCountryMapping[region.Code];
                }
            }

            var countryDestinationItem = destinationItem.Parents?.FirstOrDefault(i => i.Type == DestinationItemType.Country || i.Type == DestinationItemType.VirtualCountry);
            return countryDestinationItem;
        }

        internal static DestinationItem GetRegionFromDestinationItem(DestinationItem destinationItem)
        {
            return destinationItem.Type switch
            {
                DestinationItemType.Country or DestinationItemType.VirtualCountry => null,
                DestinationItemType.Resort or DestinationItemType.VirtualResort or DestinationItemType.Hotel => GetRegion(destinationItem),
                _ => destinationItem,
            };
        }

        internal static List<DestinationItem> GetResortsFromDestinationItem(DestinationItem destinationItem, Dictionary<string, DestinationItem> allRegions, Dictionary<string, DestinationItem> allResorts)
        {
            return destinationItem.Type switch
            {
                DestinationItemType.Country or DestinationItemType.VirtualCountry => null,
                DestinationItemType.Region => destinationItem.Children,
                DestinationItemType.VirtualRegion => destinationItem.RelatedRegions
                    .Select(code => allRegions.TryGetValue(code, out var item) ? item : null)
                    .Where(x => x != null)
                    .ToList(),
                DestinationItemType.VirtualResort => (destinationItem.RelatedResorts ?? ReadOnlyCollection<string>.Empty)
                    .Select(code => allResorts.TryGetValue(code, out var item) ? item : null)
                    .Where(x => x != null)
                    .ToList(),
                DestinationItemType.Hotel => destinationItem.Parents.Where(i => i.Type is DestinationItemType.Resort).ToList(),
                _ => [destinationItem],
            };
        }

        private static DestinationItem GetRegion(DestinationItem destinationItem)
        {
            var region = destinationItem.Parents?.FirstOrDefault(i => i.Type is DestinationItemType.Region or DestinationItemType.VirtualRegion);
            if (region != null && region.Parents == null)
            {
                region.Parents = destinationItem.Parents?.FirstOrDefault(i => i.Type is DestinationItemType.Country) is { } country ? [country] : null;
            }
            return region;
        }

        private async Task<FilterOptions> GetGeneralFilters(PackagesSearchRequest request, DateTime? startDate, DateTime? endDate, int? duration)
        {
            var accomCodes = request.AccomCodes?.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            var isHotelCodeSearch = IsHotelCodeSearch(accomCodes);
            var shouldShowResorts = false;

            List<DestinationItem> destinations;

            if (isHotelCodeSearch)
            {
                // If we search by hotel codes get countries for them only
                var destinationItems = await _destinationsService.GetDestinationsByCodes(accomCodes, true);
                GetRegionAndResortCodesFromDestinations(destinationItems, out var regionCodes, out var resortCodes);

                destinations = (await _destinationsService.GetDestinationsByCodes(regionCodes, true)).ToList();
            }
            else
            {
                var requestGeography = request.Geography;
                // extract countries, regions and resorts from request
                var (parsedCountries, parsedRegions, _) = GeographyParseUtils.ParseGeographyField(requestGeography);

                var countryCodes = new HashSet<string>(parsedCountries.Select(country => country.ToUpperInvariant()));
                var regionCodes = new HashSet<string>(parsedRegions.Select(region => region.ToUpperInvariant()));

                shouldShowResorts = ShouldShowResorts(_atcomSettings.AnywhereCode, request.OriginalGeography);
                if (shouldShowResorts)
                {
                    destinations = (await _destinationsService.GetDestinationsByCodes(regionCodes, true)).ToList();
                }
                else
                {
                    destinations = await _referenceDataService.GetAllDestinations(false);

                    if (!countryCodes.Contains(_atcomSettings.AnywhereCode))
                    {
                        destinations = destinations
                            .Where(destination =>
                                countryCodes.Contains(destination.Code) ||
                                (destination.Type == DestinationItemType.VirtualCountry && regionCodes.Any(x => destination.RelatedRegions?.Contains(x) == true)))
                            .ToList();
                    }
                }
            }

            var availableDestinationCodesByRoute = await GetAvailableDestinationCodesByRoute(request, startDate, endDate, duration);
            var virtualRegionCodeCountryCodeMapping = GetVirtualRegionCodeCountryCodeMapping(destinations);

            var options = destinations
                .Select(destination => GetFilterOption(destination, destination.Children, virtualRegionCodeCountryCodeMapping, availableDestinationCodesByRoute)).ToList();

            return new FilterOptions
            {
                Name = shouldShowResorts ? RegionVariantFilterName : DestinationVariantFilterName,
                Options = options
            };
        }

        internal static void GetRegionAndResortCodesFromDestinations(IEnumerable<DestinationItem> destinationItems,
            out HashSet<string> regionCodes, out HashSet<string> resortCodes)
        {
            var destinations = destinationItems?
                .Where(x => x.Parents != null)
                .SelectMany(x => x.Parents)
                .ToList();
            regionCodes = new HashSet<string>(destinations?
                .Where(x => x.Type == DestinationItemType.Region)
                .Select(x => x.Code) ?? new HashSet<string>());
            resortCodes = new HashSet<string>(destinations?
                .Where(x => x.Type == DestinationItemType.Resort)
                .Select(x => x.Code) ?? new HashSet<string>());
        }

        private static FilterOption GetFilterOption(DestinationItem destination, List<DestinationItem> children,
            Dictionary<string, string> virtualRegionCodeCountryCodeMapping, HashSet<string> availableDestinationCodesByRoute)
        {
            // Build the ChildOptions beforehand to avoid having to iterate through them again: see below
            var childOptions = GetChildDestinations(children, availableDestinationCodesByRoute, out var availableChildrenCount);

            return new FilterOption()
            {
                Code = destination.Code,
                Name = destination.Name,
                TrackingId = destination.TrackingId,
                Children = childOptions,
                DestinationInfo = new DestinationFilterInfo()
                {
                    Type = destination.Type,
                    RelatedRegions = destination.RelatedRegions,
                    RelatedResorts = destination.RelatedResorts,
                    Parent = destination.Type switch
                    {
                        DestinationItemType.VirtualCountry or DestinationItemType.Region => destination.Parents?.FirstOrDefault()?.Code,
                        DestinationItemType.VirtualRegion => virtualRegionCodeCountryCodeMapping.TryGetValue(destination.Code, out var countryCode) ? countryCode : null,
                        _ => null
                    }
                },
                // Count would need to be childOptions.Any(child => child.Count > 0) here, resulting in an additional looping
                Count = availableChildrenCount > 0 ? 1 : 0,
            };
        }

        internal static bool IsHotelCodeSearch(string[] accomCodes)
        {
            return accomCodes != null && accomCodes.Length > 0;
        }

        internal static bool ShouldShowResorts(string anywhereCode, HashSet<string> countryCodes, HashSet<string> regionCodes, HashSet<string> resortCodes)
        {
            var hasCountryLevel =
                    countryCodes.Contains(anywhereCode) ||
                    countryCodes.Any(country => !regionCodes.Any(region => region.StartsWith(country)));
            var hasRegionLevel = regionCodes.Any(region => !resortCodes.Any(resort => resort.StartsWith(region)));
            var firstRegionCountry = regionCodes.Any() ? regionCodes.First().Substring(0, 2) : null;
            var sameCountryRegions = firstRegionCountry != null && regionCodes.All(region => region.StartsWith(firstRegionCountry));

            return !hasCountryLevel && (!hasRegionLevel || sameCountryRegions);
        }

        /// <summary>
        /// Checks if we should show Region -> Resort level filter, otherwise show Country -> Region level filter 
        /// </summary>
        /// <param name="originalGeography">Original geography parameters without filters.</param>
        /// <returns>True if search has region/resort level search, otherwise false.</returns>
        internal static bool ShouldShowResorts(string anywhereCode, string originalGeography)
        {
            if (string.IsNullOrEmpty(originalGeography)) return false;

            var (countries, regions, resorts) = GeographyParseUtils.ParseGeographyField(originalGeography);

            var countryCodes = new HashSet<string>(countries.Select(country => country.ToUpperInvariant()));
            var regionCodes = new HashSet<string>(regions.Select(region => region.ToUpperInvariant()));
            var resortCodes = new HashSet<string>(resorts.Select(resort => resort.ToUpperInvariant()));

            return ShouldShowResorts(anywhereCode, countryCodes, regionCodes, resortCodes);
        }

        internal static bool IsPromoPageRequest(PackagesSearchRequest request)
        {
            return !string.IsNullOrEmpty(request.PromoPageId);
        }

        /// <summary>
        /// Builds <see cref="FilterOption"/>s for the passed <see cref="DestinationItem"/>, while determining their availability with the 
        /// provided <see cref="HashSet{string}"/> of routes
        /// </summary>
        /// <param name="children">the destination to build child items for</param>
        /// <param name="availableDestinationCodesByRoute">the routes to use for availability checking</param>
        /// <param name="isPromoPageSearch">determines if the search request comes from a promo page</param>
        /// <param name="regionCodes"></param>
        /// <param name="resortCodes"></param>
        /// <param name="count">the number of available children, can be later used to derive availability of <paramref name="children"/></param>
        /// <returns></returns>
        private static List<FilterOption> GetChildDestinations(List<DestinationItem> children,
            HashSet<string> availableDestinationCodesByRoute, out int count)
        {
            // has to be initialized before returning
            count = 0;
            // no children -> no options
            if (children == null)
            {
                return new List<FilterOption>();
            }
            var returnList = new List<FilterOption>(children.Count);

            foreach (var child in children)
            {
                var childOption = new FilterOption()
                {
                    Code = child.Code,
                    Name = child.Name,
                    TrackingId = child.TrackingId,
                    DestinationInfo = new DestinationFilterInfo()
                    {
                        Type = child.Type,
                        RelatedRegions = child.RelatedRegions,
                        RelatedResorts = child.RelatedResorts
                    },
                    Count = IsDestinationReachable(child, availableDestinationCodesByRoute) ? 1 : 0,
                };
                // Count will either be 0 for unavailable or 1 for available
                // adding 0 to 0 repeatedly is neutral
                count += childOption.Count;
                returnList.Add(childOption);
            }

            return returnList;
        }

        /// <summary>
        /// Gets the codes of all available destinations, depending on the provided Request.
        /// <br />
        /// Note: BOTH startDate and endDate must be provided to have influence on the result.
        /// </summary>
        /// <param name="request">the request to get the Destinations for</param>
        /// <param name="startDate">StartDate of the request, for more precise results</param>
        /// <param name="endDate">EndDate of the request, for more precise results</param>
        /// <param name="duration">Duration of stay, for more precise results</param>
        /// <returns>The codes of all available Destinations.</returns>
        private async Task<HashSet<string>> GetAvailableDestinationCodesByRoute(PackagesSearchRequest request, DateTime? startDate, DateTime? endDate, int? duration)
        {
            List<string> arrivalAirports;

            if (!startDate.HasValue || !endDate.HasValue)
            {
                arrivalAirports = await _routeAvailabilityService.GetArrivalAirports(request.Departure);
            }
            else if (!duration.HasValue)
            {
                arrivalAirports = await _routeAvailabilityService.GetArrivalAirports(request.Departure, request.FlexibleDays, startDate.Value, endDate.Value);
            }
            else
            {
                arrivalAirports = await _routeAvailabilityService.GetArrivalAirports(request.Departure, request.FlexibleDays, startDate.Value, endDate.Value, duration.Value);
            }

            // use this instead of the default filter to ensure that cities that are configured as resorts instead of regions are handled correctly
            var filter = Holidays.Api.Domain.Data.Destinations.DestinationFilter.Country
                        | Holidays.Api.Domain.Data.Destinations.DestinationFilter.Region
                        | Holidays.Api.Domain.Data.Destinations.DestinationFilter.VirtualRegion
                        | Holidays.Api.Domain.Data.Destinations.DestinationFilter.VirtualCountry
                        | Holidays.Api.Domain.Data.Destinations.DestinationFilter.Resort
                        | Holidays.Api.Domain.Data.Destinations.DestinationFilter.VirtualResort;

            var availableDestinationsByRoute = (arrivalAirports?.Any() ?? false)
                ? await _destinationsService.GetDestinationsByAirportCodes(arrivalAirports.ToArray(), null, filter)
                : null;

            var availableDestinationCodesByRoute = availableDestinationsByRoute?.Destinations?.Any() ?? false
                ? new HashSet<string>(availableDestinationsByRoute?.Destinations?.Select(dest => dest.Code))
                : null;

            return availableDestinationCodesByRoute;
        }

        /// <summary>
        /// Attempts to parse both a start- and an enddate and duration from the passed request.
        /// </summary>
        /// <param name="request">The request to use</param>
        /// <param name="startDate">parsed StartDate, nullable as it may not be extractable</param>
        /// <param name="endDate">parsed EndDate, nullable as it may not be extractable</param>
        /// <param name="duration">Duration, nullable as it may not be extractable</param>
        internal static void ExtractDatesFromRequest(PackagesSearchRequest request, out DateTime? startDate, out DateTime? endDate, out int? duration)
        {
            duration = request.Duration?.FirstOrDefault();
            startDate = DateTime.TryParse(request.StartDate, CultureInfo.InvariantCulture, out var startResult)
                ? startResult
                : null;

            endDate = DateTime.TryParse(request.EndDate, CultureInfo.InvariantCulture, out var endResult)
                ? endResult
                : null;

            if (!endDate.HasValue)
            {
                endDate = startDate.HasValue && duration.HasValue
                    ? startDate.Value.AddDays(duration.Value)
                    : null;
            }
        }

        /// <summary>
        /// Determines whether a given destination is reachable by checking if it is contained inside 
        /// the passed Set of available destinations.
        /// </summary>
        /// <param name="destination">the destination to check</param>
        /// <param name="availableDestinations">set of available destinations</param>
        /// <returns>1 if the destination is available, 0 in all other cases</returns>
        internal static bool IsDestinationReachable(DestinationItem destination, HashSet<string> availableDestinations)
        {
            // no availability at all means this destination can't be considered available
            if (availableDestinations == null)
                return false;

            // if no destination inside a virtual one can be reached it can be considered unavailable
            if (destination.Type == DestinationItemType.VirtualRegion ||
                destination.Type == DestinationItemType.VirtualCountry)
            {
                return destination.RelatedRegions?.Any(
                    relatedRegion =>
                    availableDestinations.Contains(relatedRegion)
                ) ?? false;
            }

            if (destination.Type == DestinationItemType.VirtualResort)
            {
                return destination.RelatedResorts?.Any(
                    availableDestinations.Contains
                ) ?? false;
            }

            return availableDestinations.Contains(destination.Code);
        }
    }
}
