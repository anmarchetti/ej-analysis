using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Cms.Models.Destinations;
using easyJet.Holidays.External.Cms.Models.Destinations.Code;
using easyJet.Holidays.External.Cms.Models.Destinations.Excursions;
using easyJet.Holidays.External.Cms.Models.Destinations.Image;
using easyJet.Holidays.External.Cms.Models.Destinations.Info;
using easyJet.Holidays.External.Cms.Models.Destinations.Promo;
using easyJet.Holidays.External.Cms.Models.Destinations.Titles;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.Cms.Services
{
    public class DestinationsSearchService : IDestinationsService
    {
        private static readonly string DestinationsMappingCacheKey = "DestinationsMapping";
        private static readonly string GetDestinationsByCodesCacheKey = "GetDestinationsByCodes";
        private static readonly string GetPromoDestinationsCacheKey = "GetPromoDestinations";
        private static readonly string GetTopByAirportCodesCacheKey = "GetTopByAirportCodes";
        private static readonly string GetHierarchyByAirportCodesCacheKey = "GetHierarchyByAirportCodes";
        private static readonly string GetExcursionMapKey = "GetExcursionMap";
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AtcomSettings _atcomSettings;
        private readonly ICacheService _cacheService;
        private readonly ILogger<DestinationsSearchService> _logger;
        private readonly CacheSettings _cacheSettings;
        private readonly CmsSettings _cmsSettings;
        private readonly ILanguageService _languageService;

        public DestinationsSearchService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            ILogger<DestinationsSearchService> logger,
            IOptions<AtcomSettings> atcomSettings,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IOptions<CmsSettings> cmsSettings,
            ILanguageService languageService)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _logger = logger;
            _cacheService = cacheService;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
            _languageService = languageService;
        }

        /// <summary>
        /// Search destinations by specified query and types
        /// </summary>
        /// <param name="query">Query string</param> 
        /// <param name="destinationFilter">Destination types</param>
        /// <returns>List of results</returns>
        public async Task<DestinationsSearchResponse> Search(string query, DestinationFilter destinationFilter)
        {
            var request = new DestinationsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.SearchDestinations, _httpContextAccessor.HttpContext.Request.Cookies);

            request.SearchQuery = query;
            request.DestinationFilter = destinationFilter;
            request.SetQueryString();
            request.WithScLang(_languageService?.GetCurrentLanguage() ?? string.Empty);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationsRequest, DestinationsResponse>(
                request, ApiExceptionCodes.DestinationsSearchError);

            return new DestinationsSearchResponse
            {
                Destinations = response.Payload?.Body?.Destinations,
            };
        }

        /// <inheritdoc />
        public async Task<string> GetImage(string code)
        {
            var request = new DestinationImageRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.LocationImage, _httpContextAccessor.HttpContext.Request.Cookies);

            request.Code = code;
            request.SetQueryString();

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationImageRequest, DestinationImageResponse>(
                request, ApiExceptionCodes.DestinationsImageError);

            return response?.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<DestinationItem[]> GetTitles(string[] codes)
        {
            var request = new DestinationTitlesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetTitles, _httpContextAccessor.HttpContext.Request.Cookies);

            request.Payload.Body = new DestinationTitlesRequestBody { Codes = codes };

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationTitlesRequest, DestinationTitlesResponse>(
                request, ApiExceptionCodes.DestinationsTitlesError);

            return response?.Payload?.Body;
        }

        public async Task<DestinationItem[]> GetDestinationsByAirportCodes(string[] codes)
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            var items = await _cacheService.GetOrAddMultipleAsync<DestinationItem>(
                _cacheSettings.Buckets.GetDestinationsByCodes,
                new[] { GetHierarchyByAirportCodesCacheKey, lang },
                codes,
                item => item.Code,
                async ids =>
                {
                    if (!ids.Any())
                    {
                        return new DestinationItem[0];
                    }

                    var request = new DestinationTitlesRequest();
                    request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetHierarchyByAirportCodes, _httpContextAccessor?.HttpContext?.Request?.Cookies);
                    request.Payload.Body = new DestinationTitlesRequestBody { Codes = ids.ToArray() };

                    var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationTitlesRequest, DestinationTitlesResponse>(request, ApiExceptionCodes.DestinationsTitlesError);
                    return response?.Payload?.Body;
                },
                false
            );

            return items.ToArray();
        }

        public async Task<DestinationsSearchResponse> GetDestinationsByAirportCodes(string[] codes, string query, DestinationFilter? destinationFilter = null)
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            codes = codes.Select(x => x.ToUpperInvariant()).Distinct().ToArray();
            Array.Sort(codes);
            var key = string.Join(",", codes);

            var destinationFilterKey = destinationFilter == null
                ? string.Empty
                : ((int)destinationFilter).ToString();

            var result = await _cacheService.GetOrAddAsync(
                _cacheSettings.Buckets.GetDestinationsByCodes,
                new[] { GetTopByAirportCodesCacheKey, key, query, destinationFilterKey, lang },
                async () =>
                {
                    var request = new DestinationTitlesRequest();
                    request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetTopByAirportCodes, _httpContextAccessor?.HttpContext?.Request?.Cookies);

                    var filterToUse = destinationFilter ?? (string.IsNullOrWhiteSpace(query)
                        ? DestinationFilter.Country | DestinationFilter.Region | DestinationFilter.VirtualRegion | DestinationFilter.VirtualCountry
                        : DestinationFilter.All);

                    request.Payload.Body = new DestinationTitlesRequestBody
                    {
                        Codes = codes,
                        Query = query,
                        Page = 1,
                        Take = string.IsNullOrWhiteSpace(query) ? 0 : _cmsSettings.TypeAheadPageSize,
                        Filter = filterToUse
                    };
                    request.WithScLang(lang);
                    var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationTitlesRequest, DestinationsResponse>(request, ApiExceptionCodes.DestinationsTitlesError);

                    var body = response?.Payload?.Body;

                    if (body == null)
                    {
                        return new DestinationsSearchResponse();
                    }

                    return new DestinationsSearchResponse
                    {
                        Destinations = body.Destinations,
                        Total = body.Total,
                        Page = body.Page,
                        Take = body.Take
                    };
                },
                false
            );
            return result;
        }

        public async Task<DestinationItem[]> GetDestinationsByCodes(ICollection<string> codes, bool includeRelatedItems = false)
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            var items = await _cacheService.GetOrAddMultipleAsync<DestinationItem>(
                _cacheSettings.Buckets.GetDestinationsByCodes,
                new[] { GetDestinationsByCodesCacheKey, includeRelatedItems.ToString(), lang },
                codes,
                item => item.Code,
                async ids =>
                {
                    if (!ids.Any())
                    {
                        return new DestinationItem[0];
                    }

                    var request = new DestinationTitlesRequest();
                    request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetDestinationsByCodes, _httpContextAccessor?.HttpContext?.Request?.Cookies);
                    request.Endpoint = new Uri($"{request.Endpoint}?includeRelatedItems={includeRelatedItems}");

                    request.Payload.Body = new DestinationTitlesRequestBody { Codes = ids.ToArray() };

                    var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationTitlesRequest, DestinationTitlesResponse>(
                        request, ApiExceptionCodes.DestinationsTitlesError);

                    return response?.Payload?.Body;
                },
                false
            );

            return items.ToArray();
        }

        public async Task<DestinationsMappingResponse> Map(string query)
        {
            var codes = query.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(c => c.Trim());

            // 1. read file and get dictionary of code - airport code
            var allMapping = await GetMapping();

            if (allMapping == null || allMapping.Values == null)
            {
                return new DestinationsMappingResponse();
            }

            var airportCodes = allMapping.Where(m => codes.Contains(m.Key)).SelectMany(m => m.Value).ToList();

            if (!airportCodes.Any())
            {
                return new DestinationsMappingResponse();
            }

            // 2. collect all destinations which have at least one matching airport
            var matchingDestinations = await GetDestinationsByAirportCodes(airportCodes.ToArray(), null,
                DestinationFilter.Country | DestinationFilter.VirtualCountry | DestinationFilter.Region | DestinationFilter.Resort);

            // 3. match airports to destinations
            return MapToDestinationResponse(matchingDestinations.Destinations);
        }

        /// <inheritdoc />
        public async Task<string> GetDestinationCodeByName(string name)
        {
            var request = new DestinationCodeRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetDestinationCodeByName, _httpContextAccessor.HttpContext.Request.Cookies);

            request.DestinationName = name;
            request.SetQueryString();

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationCodeRequest, DestinationCodeResponse>(
                request, ApiExceptionCodes.DestinationsCodeError);

            return response?.Payload?.Body;
        }

        /// <summary>
        /// Get destinations for promo page
        /// </summary>
        /// <param name="promoPageId"></param>
        /// <returns>Array of destinations, or empty collection if no destinations were received from CMS</returns>
        public async Task<IEnumerable<DestinationItem>> GetPromoDestinations(string promoPageId)
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            var promoDestinations = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.SearchCache,
                new[] { $"{GetPromoDestinationsCacheKey}_{promoPageId}", lang },
                async () =>
                {
                    var request = new PromoDestinationsRequest
                    {
                        Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetPromoDestinations,
                            _httpContextAccessor.HttpContext.Request.Cookies),
                        PromoPageId = promoPageId,

                    };

                    request.SetQueryString();

                    var response = await _apiService
                        .GetResponseContentAsyncWithErrorMapping<PromoDestinationsRequest, PromoDestinationsResponse>(
                            request, ApiExceptionCodes.PromoDestinationsCodeError);

                    return response?.Payload?.Body;
                }, false);

            return promoDestinations?.OrderBy(x => x.Code) ?? Enumerable.Empty<DestinationItem>();
        }

        /// <inheritdoc />
        public async Task<ExcursionsMap> GetExcursionMap(string destinationCode)
        {
            var result = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.SearchCache,
                new[] { $"{GetExcursionMapKey}_{destinationCode}" },
                async () =>
                {
                    var request = new ExcursionMapRequest
                    {
                        Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetExcursionMap,
                            _httpContextAccessor?.HttpContext?.Request?.Cookies),
                        DestinationCode = destinationCode
                    };

                    request.SetQueryString();

                    var response = await _apiService
                        .GetResponseContentAsyncWithErrorMapping<ExcursionMapRequest, ExcursionMapResponse>(
                            request, ApiExceptionCodes.ExcursionMapError);

                    var excursionsMap = response?.Payload?.Body;

                    //here's a heavy calculation to cache the prepared results
                    CalculateCentralCoordinates(excursionsMap);

                    return excursionsMap;
                }, false);

            return result;
        }

        /// <inheritdoc/>
        public async Task<DestinationInfo> GetDestinationInfo(string code)
        {
            var request = new DestinationInfoRequest
            {
                DestinationCode = code,
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetDestinationInfo, _httpContextAccessor.HttpContext.Request.Cookies)
            };

            request.SetQueryString();

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DestinationInfoRequest, DestinationInfoResponse>(
                request, ApiExceptionCodes.DestinationInfoError);

            return response?.Payload?.Body;
        }

        /// <summary>
        /// matching list of airport codes to minimum number of destinations
        /// </summary>
        /// <param name="airportCodes"></param>
        /// <param name="matchingDestinations"></param>
        /// <returns></returns>
        protected DestinationsMappingResponse MapToDestinationResponse(IEnumerable<DestinationItem> matchingDestinations)
        {
            var destinationItemsByType = GeographyParseUtils.ParseDestinationItemsByType(matchingDestinations);

            //get regions
            destinationItemsByType.TryGetValue(DestinationItemType.Region, out var regions);

            //get countries
            destinationItemsByType.TryGetValue(DestinationItemType.Country, out var countries);

            var resorts = new List<DestinationItem>();

            //it there are virtual countries, we use specific logic
            //we need to additionally get resorts
            if (destinationItemsByType.ContainsKey(DestinationItemType.VirtualCountry))
            {
                var resortsExist = destinationItemsByType.TryGetValue(DestinationItemType.Resort, out resorts);

                if (resortsExist && resorts?.Any() == true)
                {
                    var resortParents = resorts.SelectMany(item => item.Parents).ToList();

                    var regionsForResorts = resortParents.Where(parent => parent.Type == DestinationItemType.Region)
                        .DistinctBy(region => region.Code).ToList();

                    var countriesForResorts = resortParents.Where(parent => parent.Type == DestinationItemType.Country)
                        .ToList();

                    //add parents(countries and regions) of resorts to output result
                    regions = regions?.Any() == true ? regions.Concat(regionsForResorts).ToList() : regionsForResorts;
                    countries = countries?.Any() == true
                        ? countries.Concat(countriesForResorts).ToList()
                        : countriesForResorts;


                    //if more than one resort belongs to the same region we use the region then
                    var resortsGroupedByParentRegion = resorts.GroupBy(item => item.Parents.FirstOrDefault()?.Code)
                        .Where(group => !string.IsNullOrEmpty(group.Key))
                        .ToDictionary(group => group.Key, group => group.ToList());

                    //get resorts (if more then one resort in group) that belong to the same region
                    var resortsToRemove = resortsGroupedByParentRegion.Where(pair => pair.Value.Count > 1)
                        .SelectMany(pair => pair.Value).Select(resort => resort.Code).ToList();

                    if (resortsToRemove.Any() == true)
                    {
                        resorts = resorts.Where(item => !resortsToRemove.Contains(item.Code)).ToList();
                    }
                }
            }

            return new DestinationsMappingResponse
            {
                Countries = countries?.Where(item => !string.IsNullOrWhiteSpace(item.Code))
                        .Select(item => item.Code).Distinct().ToArray(),
                Regions = regions?.Where(item => !string.IsNullOrWhiteSpace(item.Code)).Select(item => item.Code)
                        .Distinct().ToArray(),
                Resorts = resorts?.Where(item => !string.IsNullOrWhiteSpace(item.Code)).Select(item => item.Code)
                        .Distinct().ToArray()
            };
        }

        /// <summary>
        /// Get destinations mapping whether from file or from cache
        /// </summary>
        /// <returns></returns>
        private async Task<Dictionary<string, List<string>>> GetMapping()
        {
            var mapping = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.DestinationsMappingData, new[] { DestinationsMappingCacheKey }, () =>
            {
                return ReadMapping();
            }, false);

            if (mapping == null)
            {
                _logger.LogError("Destinations mapping is not available");
                return new Dictionary<string, List<string>>();
            }

            return mapping;
        }

        /// <summary>
        /// Read legacy destinations to airport codes mappings from file 
        /// </summary>
        /// <returns>dictionary with key - legacy code, value - airport code</returns>
        private async Task<Dictionary<string, List<string>>> ReadMapping()
        {
            // 5102,AAR,
            // 5148,ABZ,
            // 2432,ACE,
            // 2829,ADB,
            string[] lines = System.IO.File.ReadAllLines(_atcomSettings.DestinationMappingFileLocation);

            Dictionary<string, List<string>> records = new Dictionary<string, List<string>>(lines.Length);

            for (var i = 0; i < lines.Length; i++)
            {
                string line = lines[i];
                string[] codes = line.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

                if (codes.Length != 2)
                {
                    _logger.LogError("Error parsing legacy - holidays file at line {I}: {Line}", i, line);

                    continue;
                }

                if (!records.ContainsKey(codes[0]))
                {
                    records.Add(codes[0], new List<string>());
                }

                records[codes[0]].Add(codes[1]);
            }

            return records;
        }

        /// <summary>
        /// Calculate the center point of multiple latitude/longitude coordinate pairs 
        /// </summary>
        /// <param name="excursionMap"></param>
        private static void CalculateCentralCoordinates(ExcursionsMap excursionMap)
        {
            var geoCoordinates = excursionMap?.Coordinates?.Select(hotel =>
            {
                double.TryParse(hotel.Latitude, CultureInfo.InvariantCulture, out var lat);
                double.TryParse(hotel.Longitude, CultureInfo.InvariantCulture, out var lon);
                return new { Latitude = lat, Longitude = lon };
            });

            if (geoCoordinates == null)
            {
                return;
            }

            var total = geoCoordinates.Count();

            if (total < 2)
            {
                var firstCoordinates = geoCoordinates.FirstOrDefault();

                if (firstCoordinates != null)
                {
                    excursionMap.CentralLatitude = firstCoordinates.Latitude.ToString(CultureInfo.InvariantCulture);
                    excursionMap.CentralLongitude = firstCoordinates.Longitude.ToString(CultureInfo.InvariantCulture);
                }

                return;
            }

            double x = 0;
            double y = 0;
            double z = 0;

            foreach (var geoCoordinate in geoCoordinates)
            {
                var latitude = geoCoordinate.Latitude * Math.PI / 180;
                var longitude = geoCoordinate.Longitude * Math.PI / 180;

                x += Math.Cos(latitude) * Math.Cos(longitude);
                y += Math.Cos(latitude) * Math.Sin(longitude);
                z += Math.Sin(latitude);
            }

            x /= total;
            y /= total;
            z /= total;

            var centralLongitude = Math.Atan2(y, x);
            var centralSquareRoot = Math.Sqrt(x * x + y * y);
            var centralLatitude = Math.Atan2(z, centralSquareRoot);

            centralLatitude = centralLatitude * 180 / Math.PI;

            centralLongitude = centralLongitude * 180 / Math.PI;

            excursionMap.CentralLatitude = centralLatitude.ToString(CultureInfo.InvariantCulture);

            excursionMap.CentralLongitude = centralLongitude.ToString(CultureInfo.InvariantCulture);
        }
    }
}
