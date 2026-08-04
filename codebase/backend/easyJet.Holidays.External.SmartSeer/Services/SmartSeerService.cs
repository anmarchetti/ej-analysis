using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.SmartSeer;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.SmartSeer;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.SmartSeer.Api.Services;
using easyJet.Holidays.External.SmartSeer.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.SmartSeer.Services
{
    public class SmartSeerService : ISmartSeerService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<SmartSeerService> _logger;
        private readonly SmartSeerSettings _smartSeerSettings;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IShortListService _shortListService;
        private readonly IAuthenticationService _authenticationService;
        private readonly EnvironmentBehaviourSettings _envSettings;
        
        public const string SmartSeerError_Http = "http:";
        public const string SmartSeerError_Timeout = "apiTimeout";
        public const string SmartSeerError_Other = "other";
        public const string SmartSeerError_TooFewResults = "tooFewResults";
        public const string SmartSeerError_OffersUnavailable = "offersUnavailable";
        public const string SmartSeerHolidayType = "holidayType:";
        
        /// <summary>
        /// TradePortal Market constant
        /// </summary>
        public const string SmartSeerTradePortalMarket = "TradePortal";

        public SmartSeerService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<SmartSeerSettings> smartSeerSettings,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            ILogger<SmartSeerService> logger,   
            IReferenceDataService referenceDataService,
            IShortListService shortListService,
            IAuthenticationService authenticationService
            )
        {
            _smartSeerSettings = smartSeerSettings.Value ?? throw new ArgumentNullException(nameof(smartSeerSettings));
            _referenceDataService = referenceDataService;
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _shortListService = shortListService;
            _authenticationService = authenticationService;
            _envSettings = envSettings?.Value ?? throw new ArgumentNullException(nameof(envSettings));
        }

        /// <inheritdoc />
        public async Task<SmartSeerSortedBody> GetSortedHotelCodes(IEnumerable<string> hotelIds, PackagesSearchRequest searchRequest, bool sortingEnabled = true)
        {
            SponsoredHotelsSettingSitecore sponsoredHotelsSetting = await _referenceDataService.GetSponsoredHotelsSettings();
            SmartSeerSitecoreSettings settings = await _referenceDataService.GetSmartSeerSettings();

            var request = new SmartSeerSortRequest();
            var userId = GetUserId();
            if (hotelIds == null ||
                hotelIds.Count() == 0 ||
                !settings.IsSortActive ||
                (!sortingEnabled && sponsoredHotelsSetting.IsEnabled != true) ||
                string.IsNullOrEmpty(searchRequest.MarketCode))
            {
                return new SmartSeerSortedBody();
            }

            // https://docs.smartseer.com/sort/v3#section/Full-API-specification
            request.Payload.Body = new SmartSeerSortRequestBody()
            {
                UserId = userId,
                Context = new SortRequestContent()
                {
                    Url = _httpContextAccessor.HttpContext.Request.Headers["Referer"].ToString(),
                    UserAgent = _httpContextAccessor.HttpContext.Request.Headers["User-Agent"].ToString(),
                },
                SortStrategy = sortingEnabled ? "personalized" : "noop",
                PlacementId = searchRequest.PlacementId,
                Elements = hotelIds.Select(x => new SortRequestElements()
                {
                    Id = x,
                }).ToList(),
                Query = new SortQuery()
                {
                    v5 = BuildHotelsRecomendationsFilterOptions(searchRequest),
                }
            };

            // Build Uri
            var marketCode = (_envSettings?.IsTradePortal ?? false) ? SmartSeerTradePortalMarket : searchRequest.MarketCode;
            var smartSeerMarketSpecificSettings = _smartSeerSettings.MarketSpecificSettings[marketCode];
            request.Endpoint = _endpointsProvider.GetEndpoint(
                SmartSeerEndpoint.Sort,
                marketCode,
                _httpContextAccessor.HttpContext.Request.Cookies,
                new Dictionary<string, string>() { { "trackingId", smartSeerMarketSpecificSettings.TrackingId }, { "script", smartSeerMarketSpecificSettings.Script } });

            try
            {
                var response1 = await _apiService.GetResponseContentAsync<SmartSeerSortRequest, SmartSeerSortResponse>(request);
                var response = response1?.Payload?.Body;

                if (response?.Elements?.Count != hotelIds.Count())
                {
                    // Return empty result with tracing info if response is invalid. Number of hotels before and after sort should be the same.
                    return new SmartSeerSortedBody
                    {
                        TrackingInfo = BuildTrackingInfo(request.Endpoint.AbsoluteUri, SmartSeerError_TooFewResults, response, true)
                    };
                }

                var result = new SmartSeerSortedBody
                {
                    Response = response,
                    SponsoredHotels = sponsoredHotelsSetting.IsEnabled ?
                        response?.Elements?.Where(x => x.IsSponsored).Select(x => x.Id).ToArray() : null,
                    TrackingInfo = BuildTrackingInfo(request.Endpoint.AbsoluteUri, null, response, true),
                };

                return result;
            }
            catch (Exception e)
            {
                // Handle error response form api.
                _logger.LogError(e, "Failed to load SmartSeer info");
                return new SmartSeerSortedBody
                {
                    TrackingInfo = BuildErrorTrackingInfo(request.Endpoint.AbsoluteUri, e)
                };
            }
        }

        /// <inheritdoc />
        public async Task<SmartSeerSortedBody> GetHotelsRecomendations(RecommendedSearchRequest searchRequest)
        {
            var body = new SmartSeerSortedBody();
            var settings = await _referenceDataService.GetSmartSeerSettings();

            var request = new SmartSeerRecommendationsRequest();
            var userId = GetUserId();
            if (!settings.IsRecommendedActive || string.IsNullOrEmpty(searchRequest.MarketCode))
            {
                // Return empty response if user doesnot have cookie or market code not provided
                return null;
            }

            var requestedAmount = searchRequest.RequestedAmountOfHotels != null
                ? Int32.Parse(searchRequest.RequestedAmountOfHotels)
                : settings.NumberOfRequestedHotelsSmartSeer;

            // https://docs.smartseer.com/recommender/v3#section/Full-API-specification
            var requestBody = new SmartSeerRecommendationsRequestBody()
            {
                UserId = userId,
                Limit = requestedAmount,
                PlacementId = searchRequest.PlacementId,
                Context = new RecommendationsRequestContent()
                {
                    Reffer = _httpContextAccessor.HttpContext.Request.Headers["Referer"].ToString(),
                    Filter = BuildHotelsRecomendationsFilterOptions(searchRequest, searchRequest.HotelThemeTypes),
                    PageType = searchRequest.PageType
                }
            };

            if (!string.IsNullOrEmpty(searchRequest.AccomCodes))
            {
                // only for single accomodation search
                var codes = searchRequest.AccomCodes.Split(',');
                requestBody.Context.Products = codes.Select(x => new RecommendationsProduct()
                {
                    Type = "package",
                    Id = x,
                });
            }
            else
            {
                var customerId = await _authenticationService.MappedCustomerId();
                if (!string.IsNullOrEmpty(customerId))
                {
                    var shortlist = await _shortListService.GetUserShortList(customerId);
                    if (!shortlist.IsNullOrEmpty())
                    {
                        requestBody.Context.Products = shortlist.Select(x => new RecommendationsProduct()
                        {
                            Type = "package",
                            Id = x.AccommodationId,
                        });
                    }
                }
            }

            request.Payload.Body = requestBody;

            // Build Uri
            var marketCode = (_envSettings?.IsTradePortal ?? false) ? SmartSeerTradePortalMarket : searchRequest.MarketCode;
            var smartSeerMarketSpecificSettings = _smartSeerSettings.MarketSpecificSettings[marketCode];
            request.Endpoint = _endpointsProvider.GetEndpoint(
                SmartSeerEndpoint.Recommendations,
                marketCode,
                _httpContextAccessor.HttpContext.Request.Cookies,
                new Dictionary<string, string>() { { "trackingId", smartSeerMarketSpecificSettings.TrackingId }, { "script", smartSeerMarketSpecificSettings.Script } });

            try
            {
                var response = (await _apiService.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(request))?.Payload?.Body;
                if (!string.IsNullOrEmpty(response?.Info?.P13nGroup) && _smartSeerSettings.EmptyResponseAllowedFor?.Contains(response.Info.P13nGroup) == true && response?.Elements?.Count == 0)
                {
                    // No recommended offers if user is not in test group or if SmartSeer api is disabled
                    return null;
                }
                if (response?.Elements?.Count < settings.NumberOfRequestedHotelsSmartSeer && response?.Elements?.Count < settings.MinimumHotelsAvailable)
                {
                    // Return empty result with tracing info if response is invalid. Number of hotel beffor and after sort should be the same.
                    body.Response = null;
                    body.TrackingInfo = BuildTrackingInfo(request.Endpoint.AbsoluteUri, SmartSeerError_TooFewResults, response);
                    body.TrackingInfo.RecoInfo = response?.Info;
                }
                else
                {
                    foreach (var item in response?.Elements?.EmptyIfNull())
                    {
                        // ids returned from recommendations endpoint look like "reco:ej:ESMJ0002"
                        item.Id = item.Id.Replace("reco:", "").Replace("ej:", "");
                        // check if any of the campaigns linked to the hotel are sponsored.
                        item.IsSponsored = item.Campaigns?.Any(x => x.IsSponsored) ?? false;
                    }

                    body.Response = response;
                    body.TrackingInfo = BuildTrackingInfo(request.Endpoint.AbsoluteUri, null, response);
                    body.TrackingInfo.RecoInfo = response?.Info;
                }
            }
            catch (Exception e)
            {
                // Handle error response form api.
                body.Response = null;
                body.TrackingInfo = BuildErrorTrackingInfo(request.Endpoint.AbsoluteUri, e);
                _logger.LogError(e, "Failed to load SmartSeer recommendations");
            }
            return body;
        }

        /// <summary>
        /// Build SmartSeer filters to search
        /// </summary>
        /// <param name="searchRequest">Search request</param>
        /// <param name="hotelThemeTypes">Hotel theme types</param>
        /// <returns></returns>
        private static RecommendationsRequestFilter BuildHotelsRecomendationsFilterOptions(PackagesSearchRequest searchRequest, string hotelThemeTypes = null)
        {
            var holidayTypes = (hotelThemeTypes ?? "").Split(',').Where(h => !string.IsNullOrEmpty(h)).Select(h => SmartSeerHolidayType + h).ToArray();
            var filters = new RecommendationsRequestFilter()
            {
                Board = searchRequest.BoardType?.Split(','),
                Origin = (searchRequest.DepartureAirport ?? searchRequest.Departure)?.Split(','),
                Tags = holidayTypes
                    .Concat((searchRequest.Facilities ?? "").Split(','))
                    .Where(x => !string.IsNullOrEmpty(x))
                    .ToArray(),
                Destination = searchRequest.Destinations,
            };

            BuildDurationFilterOptions(filters, searchRequest);
            BuildPriceFilterOptions(filters, searchRequest);
            BuildPeriodFilterOptions(filters, searchRequest);
            BuildRomsFilterOptions(filters, searchRequest);
            BuildRatingFilterOptions(filters, searchRequest);
            BuildCategoryStarsFilterOptions(filters, searchRequest);

            return filters;
        }

        private static void BuildDurationFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)
        {
            if (searchRequest.Duration?.Count > 0)
            {
                filters.Duration = new RecommendationsRequestMaxMin<int?>()
                {
                    Max = searchRequest.Duration.Max(),
                    Min = searchRequest.Duration.Min(),
                };
            }
        }
        private static void BuildPriceFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)

        {
            if (searchRequest.PriceFrom > 0 || searchRequest.PriceTo > 0)
            {
                var price = new RecommendationsRequestMaxMin<decimal?>();
                if (searchRequest.PriceFrom > 0)
                {
                    price.Min = searchRequest.PriceFrom;
                }
                if (searchRequest.PriceTo > 0)
                {
                    price.Max = searchRequest.PriceTo;
                }
                filters.Price = price;
            }
        }
        private static void BuildPeriodFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)
        {
            if (!string.IsNullOrEmpty(searchRequest.StartDate))
            {
                filters.Period = new RecommendationsRequestPeriod()
                {
                    From = searchRequest.StartDate,
                };
            }
        }
        private static void BuildRomsFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)
        {
            if (searchRequest.Room?.Count > 0)
            {
                var childAges = searchRequest.ChildAges?.Split(',').ToList();
                List<RecommendationsRequestRooms> rooms = new List<RecommendationsRequestRooms>();
                for (var i = 0; i < searchRequest.Room.Count; i++)
                {
                    var r = searchRequest.Room[i];
                    RecommendationsRequestRooms room = new RecommendationsRequestRooms()
                    {
                        Adults = r.Adults,
                        Infants = r.Infants,
                    };
                    // Children object should cntains only chuild ages
                    if (childAges?.Count > 0 && r.Children > 0)
                    {
                        var ages = childAges.GetRange(0, r.Children);
                        room.Children = ages.Select(x => { int.TryParse(x, out int res); return res; }).ToArray();
                        childAges.RemoveRange(0, r.Children);
                    }
                    rooms.Add(room);
                }
                filters.Rooms = rooms;
            }
        }
        private static void BuildRatingFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)
        {
            if (searchRequest.TripAdvisorRating > 0)
            {
                filters.Rating10 = new RecommendationsRequestMaxMin<int?>()
                {
                    Min = searchRequest.TripAdvisorRating
                };
            }
        }
        private static void BuildCategoryStarsFilterOptions(RecommendationsRequestFilter filters, PackagesSearchRequest searchRequest)
        {
            if (!string.IsNullOrEmpty(searchRequest.StarRating))
            {
                IEnumerable<int> stars = searchRequest.StarRating.Split(',').Select(x => int.Parse(x));
                filters.CategoryStars10 = new RecommendationsRequestMaxMin<int?>()
                {
                    Max = stars.Max(),
                    Min = stars.Min(),
                };
            }
        }

        /// <summary>
        /// Build tracking info basep on seponse.
        /// </summary>
        /// <param name="requestURL">SmartSeer request URl</param>
        /// <param name="apiMessage">Api error message</param>
        /// <param name="response">SmartSeer response</param>
        /// <param name="isSortRequest">Whether tracking info relates to sort request or recommendation request</param>
        private SmartSeerTrackingInfo BuildTrackingInfo(string requestURL, string apiMessage = null, SmartSeerResponseBody response = null, bool isSortRequest = false)
        {
            if (isSortRequest && _smartSeerSettings.IsDirectHotelsShouldBeRemovedFromTracking)
            {
                var tracking = JsonConvert.DeserializeObject<SmartSeerTracking>(JsonConvert.SerializeObject(response?.Tracking));

                if (tracking != null)
                {
                    tracking.CampaignInfo = tracking.CampaignInfo.Where(i => i.Name != "steering_all_direct_hotels").ToList();
                }

                return new SmartSeerTrackingInfo()
                {
                    ApiUrl = requestURL,
                    PToken = response?.Ptoken,
                    Tracking = tracking,
                    ApiMessage = apiMessage,
                };
            }

            return new SmartSeerTrackingInfo()
            {
                ApiUrl = requestURL,
                PToken = response?.Ptoken,
                Tracking = response?.Tracking,
                ApiMessage = apiMessage,
            };
        }

        /// <summary>
        /// Build error tracking info.
        /// </summary>
        /// <param name="requestURL">SmartSeer request URl</param>
        /// <param name="ex">Exception to handle</param>
        private SmartSeerTrackingInfo BuildErrorTrackingInfo(string requestURL, Exception ex)
        {
            string message = null;
            if (ex?.InnerException is SmartSeerException)
            {
                message = $"{SmartSeerError_Http}{(int)((SmartSeerException)ex.InnerException).StatusCode}";
            }
            else if (ex?.InnerException is TimeoutException)
            {
                message = SmartSeerError_Timeout;
            }
            else
            {
                message = SmartSeerError_Other;
            }
            return BuildTrackingInfo(requestURL, message);
        }

        private string GetUserId()
        {
            string idFomHeaders = _httpContextAccessor.HttpContext.Request.Headers[_smartSeerSettings.UserIdCookie];
            string idFromCookie = _httpContextAccessor.HttpContext.Request.Cookies[_smartSeerSettings.UserIdCookie];
            return string.IsNullOrEmpty(idFomHeaders) ? idFromCookie : idFomHeaders;
        }

        /// <inheritdoc />
        public async Task<SmartSeerRecommendations> GetRecommendedDestinations(DestinationsRecommendationRequest request)
        {
            var settings = await _referenceDataService.GetSmartSeerSettings();

            var userId = GetUserId();
            if (!settings.IsRecommendedActive || string.IsNullOrEmpty(request?.MarketCode))
            {
                // Return empty response if user doesnot have cookie or market code not provided
                return new SmartSeerRecommendations { DestinationCodes = [] };
            }

            var requestBody = new SmartSeerRecommendationsRequestBody()
            {
                UserId = userId,
                Limit = 500,
                PlacementId = "ejh-inspire-me",
                Context = new RecommendationsRequestContent()
                {
                    Filter = BuildDestinationsRecomendationFilterOptions(request),
                }
            };

            var smartSeerMarketSpecificSettings = _smartSeerSettings.MarketSpecificSettings[request.MarketCode];
            var smartseerRequest = new SmartSeerRecommendationsRequest();
            smartseerRequest.Payload.Body = requestBody;
            smartseerRequest.Endpoint = _endpointsProvider.GetEndpoint(
                SmartSeerEndpoint.Recommendations,
                request.MarketCode,
                _httpContextAccessor.HttpContext.Request.Cookies,
                new Dictionary<string, string>() {
                    { "trackingId", smartSeerMarketSpecificSettings.TrackingId },
                    { "script", smartSeerMarketSpecificSettings.Script } });

            try
            {
                var response = (await _apiService.GetResponseContentAsync<SmartSeerRecommendationsRequest, SmartSeerRecommendationsResponse>(smartseerRequest))?.Payload?.Body;
                if (!string.IsNullOrEmpty(response?.Info?.P13nGroup) && _smartSeerSettings.EmptyResponseAllowedFor?.Contains(response.Info.P13nGroup) == true && response.Elements?.Count == 0)
                {
                    // No recommended offers if user is not in test group or if SmartSeer api is disabled
                    return new SmartSeerRecommendations { DestinationCodes = [] };
                }
                else
                {
                    var destinationCodes = response?.Elements.EmptyIfNull().Select(item => item.Id   //ids returned from recommendations endpoint look like "reco:[country/region]:TRAN"
                        .Replace("reco:", "", StringComparison.InvariantCultureIgnoreCase)
                        .Replace("country:", "", StringComparison.InvariantCultureIgnoreCase)
                        .Replace("region:", "", StringComparison.InvariantCultureIgnoreCase));

                    var trackingInfo = BuildTrackingInfo(smartseerRequest.Endpoint.AbsoluteUri, null, response);
                    trackingInfo.RecoInfo = response?.Info;

                    return new SmartSeerRecommendations
                    {
                        DestinationCodes = destinationCodes,
                        TrackingInfo = trackingInfo
                    };
                }
            }
            catch (ApiRequestException exception)
            {
                // Handle error response form api.
                _logger.LogError(exception, "Failed to load SmartSeer recommendations");
                return new SmartSeerRecommendations { DestinationCodes = [] };
            }
        }

        private static RecommendationsRequestFilter BuildDestinationsRecomendationFilterOptions(DestinationsRecommendationRequest request)
        {
            return new RecommendationsRequestFilter
            {
                Origin = request.Origin?.ToArray(),
                Tags = request.Tags?.ToArray(),
                Period = new RecommendationsRequestPeriod
                {
                    From = request.PeriodFrom,
                    To = request.PeriodTo
                },
                Rooms = [new RecommendationsRequestRooms
                {
                    Adults = request.Adults ?? 0,
                    Infants = request.Infants ?? 0,
                    Children = request.ChildAges?.ToArray()
                }]
            };
        }
    }
}
