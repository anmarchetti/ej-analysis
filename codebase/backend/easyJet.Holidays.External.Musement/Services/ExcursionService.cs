using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Excursions;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Musement.Mappers;
using easyJet.Holidays.External.Musement.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.Musement.Services
{
    public class ExcursionService : IExcursionService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _musementEndpointsProvider;
        private readonly IDestinationsService _destinationsService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly MusementSettings _musementSettings;
        private readonly IMarketService _marketService;
        private readonly ILanguageService _languageService;

        public ExcursionService(
            IApiService apiService,
            EndpointsProvider musementRequestBuilder,
            IHttpContextAccessor httpContextAccessor,
            IOptions<MusementSettings> musementSettings,
            IDestinationsService destinationsService,
            IMarketService marketService,
            ILanguageService languageService
            )
        {
            _apiService = apiService;
            _musementEndpointsProvider = musementRequestBuilder;
            _httpContextAccessor = httpContextAccessor;
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
            _destinationsService = destinationsService;
            _marketService = marketService;
            _languageService = languageService;
        }

        /// <inheritdoc />
        public async Task<ExcursionsResponse> Search(ExcursionsRequest request)
        {
            var market = _marketService.GetCurrentMarket();
            var language = _languageService.GetCurrentLanguage();

            var searchActivitiesRequest = new SearchActivitiesRequest
            {
                Endpoint = _musementEndpointsProvider.GetEndpoint(MusementEndpoint.SearchActivities, _httpContextAccessor?.RequestCookies())
            };

            searchActivitiesRequest.Take = request.Take ?? _musementSettings.Take;
            searchActivitiesRequest.AvailableFrom = request.StartDate;
            searchActivitiesRequest.AvailableTo = request.EndDate;

            // get city ids or hotel coordinates from CMS
            var excursionMap = await _destinationsService.GetExcursionMap(request.DestinationCode);

            if (excursionMap == null)
            {
                throw new ApiException(ApiExceptionCodes.ExcursionMapError,
                    ApiExceptionCodes.ExcursionMapError.Description, null, null, HttpStatusCode.NotFound);
            }

            //found a match between destinations from CMS and the musement ids -> search by musement ids
            if (excursionMap?.MusementIds?.Any() == true)
            {
                switch (excursionMap.Type)
                {
                    case DestinationItemType.Country:
                        // for country we always get one country code mapped one-to-one
                        searchActivitiesRequest.CountryIn = excursionMap.MusementIds?.FirstOrDefault();
                        break;
                    case DestinationItemType.Region:
                    case DestinationItemType.Resort:
                        {
                            // for region and resort we can get one id or many ids, both cases are acceptable
                            searchActivitiesRequest.CityIn = string.Join(",", excursionMap.MusementIds);
                            break;
                        }
                    default:
                        throw new ArgumentOutOfRangeException(nameof(excursionMap.Type));
                }
            }
            //destinations from CMS and musement ids not mapped, we should search by coordinates and radius
            else
            {
                //impossible to calculate coordinates
                if (string.IsNullOrWhiteSpace(excursionMap.CentralLatitude) || string.IsNullOrWhiteSpace(excursionMap.CentralLongitude))
                {
                    throw new ApiException(ApiExceptionCodes.ExcursionMapCoordinatesError,
                        ApiExceptionCodes.ExcursionMapCoordinatesError.Description, null, null, HttpStatusCode.NotFound);
                }

                searchActivitiesRequest.Coordinates = $"{excursionMap.CentralLatitude},{excursionMap.CentralLongitude}";
                searchActivitiesRequest.Distance = $"{excursionMap.Radius}KM";
            }

            var currency = market?.Currency.Code;
            searchActivitiesRequest.Currency = currency;

            searchActivitiesRequest.SetQueryString();
            searchActivitiesRequest.BuildRequestMessage(_apiService.MediaType);

            var urlLanguage = _musementSettings.UrlLanguageMap[language];
            var headerLanguage = _musementSettings.HeaderLanguageMap[language];

            searchActivitiesRequest.HttpRequestMessage.Headers.Add(_musementSettings.CurrencyHeader, currency);
            searchActivitiesRequest.HttpRequestMessage.Headers.Add(_musementSettings.AcceptLanguageHeader, headerLanguage);

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<SearchActivitiesRequest, SearchActivitiesResponse>(
                    searchActivitiesRequest, ApiExceptionCodes.GetActivitiesError);

            var whiteLabelUrl = await GetWhiteLabelUrl(request, excursionMap, response, urlLanguage, currency);

            var hostReplacement = $"{_musementSettings.WhiteLabel.Host}/{urlLanguage}";

            var result = ExcursionMapper.MapExcursionResponse(response.Payload.Body.Data, whiteLabelUrl, hostReplacement, currency);

            return result;
        }

        /// <summary>
        /// Get whitelabel url
        /// </summary>
        /// <param name="request"></param>
        /// <param name="excursionMap"></param>
        /// <param name="searchActivitiesResponse"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentOutOfRangeException"></exception>
        private async Task<string> GetWhiteLabelUrl(ExcursionsRequest request, ExcursionsMap excursionMap, SearchActivitiesResponse searchActivitiesResponse, string urlLanguage, string currency)
        {
            var activities = searchActivitiesResponse.Payload.Body.Data;

            // if activities response is empty or null, we don't have sense to build whitelabel url
            if (activities?.Any() != true)
            {
                return "";
            }

            // use date range one-to-one from request
            var whiteLabelRequest = new WhiteLabelRequest
            {
                AvailableFrom = request.StartDate,
                AvailableTo = request.EndDate,
                Currency = currency
            };

            var urlSegments = new Dictionary<string, string>
            {
                { "language_code", urlLanguage }
            };


            if (excursionMap?.MusementIds?.Any() == true)
            {
                switch (excursionMap.Type)
                {
                    case DestinationItemType.Country:
                        {
                            // for country we need to get whitelabel url like this pattern:
                            // "https://whitelabel.com/{language_code}/search?country_in=COUNTRY_CODE&country_title=COUNTRY_NAME"
                            whiteLabelRequest.Endpoint = _musementEndpointsProvider.GetEndpoint(MusementEndpoint.WhiteLabelSearch, null, urlSegments);
                            whiteLabelRequest.CountryIn = excursionMap.MusementIds.FirstOrDefault();
                            whiteLabelRequest.CountryTitle = activities.FirstOrDefault().City?.Country?.Name;
                        }
                        break;
                    case DestinationItemType.Region:
                    case DestinationItemType.Resort:
                        {
                            var cityName = activities.FirstOrDefault().City?.Name?.ToLower().Replace(' ', '-');

                            // for single city matching (perfect match) we need to get whitelabel url like this pattern:
                            // https://whitelabel.com/{language_code}/{city_name}
                            urlSegments["city_name"] = cityName;
                            whiteLabelRequest.Endpoint = _musementEndpointsProvider.GetEndpoint(MusementEndpoint.WhiteLabelCity, null, urlSegments);
                        }
                        break;
                    default:
                        throw new ArgumentOutOfRangeException(nameof(excursionMap.Type));
                }
            }
            else
            {
                // when not match ids we need to get all cities by central coordinates and radius,
                // and then use the first city_name as more relevant text using this pattern: 
                // https://whitelabel.com/{language_code}/search?search_nearby=1&text=city_name
                whiteLabelRequest.Endpoint = _musementEndpointsProvider.GetEndpoint(MusementEndpoint.WhiteLabelSearch, null, urlSegments);
                var cities = await GetCitiesByCoordinates($"{excursionMap?.CentralLatitude},{excursionMap?.CentralLongitude}", excursionMap?.Radius.ToString(CultureInfo.InvariantCulture));
                whiteLabelRequest.Text = cities.FirstOrDefault()?.Name?.ToLower().Replace(' ', '-');  // use first city as more relevant for this case
                whiteLabelRequest.SearchNearBy = 1;
            }

            whiteLabelRequest.SetQueryString();

            return !string.IsNullOrWhiteSpace(whiteLabelRequest.QueryParams) ?
                    $"{whiteLabelRequest.Endpoint}?{whiteLabelRequest.QueryParams}" :
                    whiteLabelRequest.Endpoint.ToString();
        }

        /// <summary>
        /// Get cities by coordinates and radius
        /// </summary>
        /// <param name="coordinates"></param>
        /// <param name="distance"></param>
        /// <returns></returns>
        private async Task<IEnumerable<SearchCitiesResponseBody>> GetCitiesByCoordinates(string coordinates, string distance)
        {
            var searchCitiesRequest = new SearchCitiesRequest
            {
                Endpoint = _musementEndpointsProvider.GetEndpoint(MusementEndpoint.SearchCities, _httpContextAccessor?.RequestCookies()),
                Coordinates = coordinates,
                Distance = distance
            };

            searchCitiesRequest.SetQueryString();

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<SearchCitiesRequest, SearchCitiesResponse>(
                    searchCitiesRequest, ApiExceptionCodes.GetCitiesError);

            var result = response?.Payload?.Body;

            return result;
        }
    }
}
