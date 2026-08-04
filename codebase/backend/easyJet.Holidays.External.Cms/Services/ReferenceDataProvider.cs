using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.Api.Domain.Data.Filters;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.ReferenceData.Luggage;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Data.Themes;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Models;
using easyJet.Holidays.External.Cms.Models.Airports;
using easyJet.Holidays.External.Cms.Models.Boards;
using easyJet.Holidays.External.Cms.Models.Destinations;
using easyJet.Holidays.External.Cms.Models.DialingCodes;
using easyJet.Holidays.External.Cms.Models.Facilities;
using easyJet.Holidays.External.Cms.Models.Filters;
using easyJet.Holidays.External.Cms.Models.GiataMappings;
using easyJet.Holidays.External.Cms.Models.Hotels.AllHotelCodes;
using easyJet.Holidays.External.Cms.Models.ItemByPath;
using easyJet.Holidays.External.Cms.Models.Luggage;
using easyJet.Holidays.External.Cms.Models.Rooms;
using easyJet.Holidays.External.Cms.Models.SpecialRequests;
using easyJet.Holidays.External.Cms.Models.Themes;
using easyJet.Holidays.External.Cms.Models.Transfers;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api.Payload;
using easyJet.Holidays.External.Domain.Models.LivePrice;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Airport = easyJet.Holidays.Api.Domain.Data.ReferenceData.Airport;
using BoardType = easyJet.Holidays.Api.Domain.Data.ReferenceData.BoardType;
using Country = easyJet.Holidays.Api.Domain.Data.ReferenceData.Country;
using RoomType = easyJet.Holidays.Api.Domain.Data.ReferenceData.RoomType;

namespace easyJet.Holidays.External.Cms.Services
{
    public class ReferenceDataProvider : IReferenceDataProvider
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly CmsSettings _cmsSettings;
        private readonly ILogger<ReferenceDataProvider> _logger;
        private readonly Dictionary<SitecoreSettings, string> _sitecoreSettingsPath;

        public ReferenceDataProvider(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IOptions<CmsSettings> cmsSettings,
            ILogger<ReferenceDataProvider> logger)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _cmsSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
            _logger = logger;

            _sitecoreSettingsPath = new Dictionary<SitecoreSettings, string>
            {
                { SitecoreSettings.SmartSeer, _cmsSettings.ContentPath.SmartSeerSettings },
                { SitecoreSettings.Discount, _cmsSettings.ContentPath.DiscountSettings },
                { SitecoreSettings.Filter, _cmsSettings.ContentPath.FilterSettings },
                { SitecoreSettings.MapsInfo, _cmsSettings.ContentPath.MapsInfo },
                { SitecoreSettings.OtherRoutes, _cmsSettings.ContentPath.OtherRoutesSettings },
                { SitecoreSettings.PriceJump, _cmsSettings.ContentPath.PriceJumpSettings },
                { SitecoreSettings.SpecialRequest, _cmsSettings.ContentPath.SpecialRequestSettings },
                { SitecoreSettings.SponsoredHotels, _cmsSettings.ContentPath.SponsoredHotelsSettings },
                { SitecoreSettings.CreditBooking, _cmsSettings.ContentPath.CreditBookingSettings },
                { SitecoreSettings.Benefits, _cmsSettings.ContentPath.Benefits },
                { SitecoreSettings.AircraftTypes, _cmsSettings.ContentPath.AircraftTypes },
                { SitecoreSettings.AmendBooking, _cmsSettings.ContentPath.AmendBookingSettings },
                { SitecoreSettings.PriceLimit, _cmsSettings.ContentPath.PriceLimitSettings },
                { SitecoreSettings.CustomerDetailsForm, _cmsSettings.ContentPath.CustomerDetailsFormSettings },
                { SitecoreSettings.PromoCode, _cmsSettings.ContentPath.PromoCodeSettings },
                { SitecoreSettings.Luggage, _cmsSettings.ContentPath.Luggage },
                { SitecoreSettings.LuggageSettings, _cmsSettings.ContentPath.LuggageSettings },
                { SitecoreSettings.FlightExtraInformationSettings, _cmsSettings.ContentPath.FlightExtraInformationSettings },
                { SitecoreSettings.ContactUsCaseTypes, _cmsSettings.ContentPath.ContactUsCaseTypes },
                { SitecoreSettings.WeatherTypes, _cmsSettings.ContentPath.WeatherTypes },
                { SitecoreSettings.ExtraPriceBreakdownSettings, _cmsSettings.ContentPath.ExtraPriceBreakdownSettings },
                { SitecoreSettings.ComplimentarySettings, _cmsSettings.ContentPath.ComplimentarySettings },
                { SitecoreSettings.ExternalExtrasSettings, _cmsSettings.ContentPath.ExternalExtrasSettings },
                { SitecoreSettings.PaymentMethodsSettings, _cmsSettings.ContentPath.PaymentMethodsSettings },
                { SitecoreSettings.PromotionsCollectionsConfig, _cmsSettings.ContentPath.PromotionsCollectionsConfig },
                { SitecoreSettings.TradeAgentFeedbackAttachedFileSettings, _cmsSettings.ContentPath.TradeAgentFeedbackAttachedFileSettings },
                { SitecoreSettings.TouristTaxSettings, _cmsSettings.ContentPath.TouristTaxSettings },
                { SitecoreSettings.MyBookingsSettings, _cmsSettings.ContentPath.MyBookingsSettings }
            };
        }

        /// <inheritdoc />
        public async Task<List<Airport>> GetAirports(string language)
        {
            var request = new AirportsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.Airports, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<AirportsRequest, AirportsResponse>(
                request, ApiExceptionCodes.AirportsReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<Country>> GetCountries(string language)
        {
            var request = new CountriesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.Countries, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<CountriesRequest, CountriesResponse>(
                request, ApiExceptionCodes.CountriesReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<DialingCode>> GetDialingCodes(string language)
        {
            var request = new DialingCodesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.DialingCodes, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DialingCodesRequest, DialingCodesResponse>(
                request, ApiExceptionCodes.DialingCodesReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<BoardType>> GetBoardTypes(string language)
        {
            var request = new BoardTypesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.BoardTypes, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<BoardTypesRequest, BoardTypesResponse>(
                request, ApiExceptionCodes.BoardTypesReferenceDataError);

            return response.Payload.Body;
        }

        public async Task<List<Holidays.Api.Domain.Data.Hotels.HotelTransfer>> GetAllTransfers(string language)
        {
            var request = new TransfersRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.Transfers, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<TransfersRequest, TransfersResponse>(
                request, ApiExceptionCodes.TransfersReferenceDataError);

            return response.Payload.Body;
        }

        public async Task<List<string>> GetAllHotelCodes(string language)
        {
            var request = new AllHotelCodesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllHotelCodes, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<AllHotelCodesRequest, AllHotelCodesResponse>(
                request, ApiExceptionCodes.HotelCodesReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<RoomType>> GetRoomTypes()
        {
            var result = await (_cmsSettings.RunInParralel ? GetRoomTypesOptimised() : GetRoomTypesNonOptimal());
            return result;
        }

        /// <inheritdoc />
        public async Task<List<FilteredFacility>> GetFilterFacilities(string language)
        {
            var request = new FilteredFacilitiesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.FilteredFacilities, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<FilteredFacilitiesRequest, FilteredFacilitiesResponse>(
                request, ApiExceptionCodes.FilteredFacilitiesReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<OfferFilterOptions> GetOfferFilters(string language)
        {
            var request = new OfferFiltersRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetOfferFilterOptions, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<OfferFiltersRequest, OfferFiltersResponse>(
                request, ApiExceptionCodes.FilteredFacilitiesReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<FilterPillsConfig> GetFilterPillsConfig(string language)
        {
            var request = new FilterPillsConfigRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetFilterPillsConfig, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<FilterPillsConfigRequest, FilterPillsConfigResponse>(
                request, ApiExceptionCodes.FilteredFacilitiesReferenceDataError);

            return response.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, string>> GetAccommodationToGiataMappings(string language, IEnumerable<string> accommodatonCodes)
        {
            if (accommodatonCodes is null || !accommodatonCodes.Any())
            {
                return new Dictionary<string, string>();
            }

            var request = new AccommodationCodeToGiataMappingsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAccommodationCodeToGiataCodeMapping, Cookies());
            request.Payload = new JsonApiPayload<object>()
            {
                Body = new
                {
                    AtcomIds = accommodatonCodes
                }
            };
            request.WithScLang(language);

            var response =
                await _apiService
                    .GetResponseContentAsyncWithErrorMapping<AccommodationCodeToGiataMappingsRequest,
                        AccommodationCodeToGiataMappingResponse>(request,
                        ApiExceptionCodes.AccommodationCodeToGiataError);


            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<T> GetSitecoreSetting<T>(SitecoreSettings setting, string language, bool withChildren = false)
        {
            var request = new ItemByPathRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.Content, Cookies());
            request.Path = _sitecoreSettingsPath[setting];
            request.ReadAll = true;
            request.WithChildren = withChildren;
            request.SetQueryString(null, new QueryStringOptions
            {
                UseBooleanString = true
            });

            request.WithScLang(language);
            
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<ItemByPathRequest, ItemByPathResponse<T>>(
                request, ApiExceptionCodes.SettingsError);

            return response.Payload.Body;
        }

        private Polly.Retry.AsyncRetryPolicy BuildPolicy()
        {
            var policy = Policy.Handle<Exception>().WaitAndRetryAsync(
               retryCount: _cmsSettings.RetryPolicy.RetryCount,
               sleepDurationProvider: attempt => TimeSpan.FromMilliseconds(_cmsSettings.RetryPolicy.SleepMls), // Wait 200ms between each try.,
               onRetry: (exception, calculatedWaitDuration) => // Capture some info for logging!
                {
                    _logger.LogError(exception, "Got error");
                }
           );
            return policy;
        }

        private async Task<List<RoomType>> GetRoomTypesNonOptimal()
        {
            var results = new List<RoomType>();
            int estimatedTotal;

            var probeChunk = await GetRoomTypesPaged(1, 1);

            if (probeChunk != null && probeChunk.RoomTypes != null && probeChunk.RoomTypes.Count > 0)
            {
                estimatedTotal = probeChunk.Total;
            }
            else
            {
                return results;
            }

            var numberOfThreads = Math.Ceiling((double)estimatedTotal / _cmsSettings.PageSize);

            var policy = BuildPolicy();

            for (var page = 1; page <= numberOfThreads; page++)
            {
                try
                {
                    var chunkResult = await policy.ExecuteAndCaptureAsync(() => GetRoomTypesPaged(page, _cmsSettings.PageSize));
                    if (chunkResult.Outcome == OutcomeType.Failure)
                    {
                        throw chunkResult.FinalException;
                    }

                    results.AddRange(chunkResult.Result?.RoomTypes ?? new List<RoomType>());
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Was not able to fetch page {Page} out of {NumberOfThreads} from Rooms", page, numberOfThreads);
                }
            }

            return results;
        }

        private async Task<List<RoomType>> GetRoomTypesOptimised()
        {
            var results = new List<RoomType>();
            int estimatedTotal;

            var probeChunk = await GetRoomTypesPaged(1, 1);

            if (probeChunk != null && probeChunk.RoomTypes != null && probeChunk.RoomTypes.Count > 0)
            {
                estimatedTotal = probeChunk.Total;
            }
            else
            {
                return results;
            }

            var numberOfThreads = Math.Ceiling((double)estimatedTotal / _cmsSettings.PageSize);

            var policy = BuildPolicy();
            var roomTypesTasks = Enumerable.Range(1, (int)numberOfThreads).Select(async page =>
            {
                try
                {
                    var result = new List<RoomType>();
                    var chunkResult = await policy.ExecuteAndCaptureAsync(() => GetRoomTypesPaged(page, _cmsSettings.PageSize));
                    if (chunkResult.Outcome == OutcomeType.Failure)
                    {
                        throw chunkResult.FinalException;
                    }

                    return chunkResult.Result?.RoomTypes ?? new List<RoomType>();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Was not able to fetch page {Page} out of {NumberOfThreads} from Rooms", page, numberOfThreads);
                }

                return new List<RoomType>();
            });


            var roomTypesResults = await Task.WhenAll(roomTypesTasks);
            roomTypesResults.ToList().ForEach(resultChunk => results.AddRange(resultChunk));

            return results;
        }

        /// <inheritdoc />
        public async Task<RoomTypesResponseInner> GetRoomTypesPaged(int page, int take)
        {
            var request = new RoomTypesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.RoomTypes, Cookies());

            request.Page = page;
            request.Take = take;
            request.SetQueryString();

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<RoomTypesRequest, RoomTypesResponse>(
                request, ApiExceptionCodes.RoomTypesReferenceDataError);

            return response.Payload.Body;
        }

        public async Task<RoomType> GetRoomType(string code)
        {
            var request = new RoomTypesByCodeRequest();
            request.Payload.Body = new RoomTypesByCodeRequestBody
            {
                Codes = new[] { code }
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.RoomTypeByCode, Cookies());

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<RoomTypesByCodeRequest, RoomTypesByCodeResponse>(
                request, ApiExceptionCodes.RoomTypesReferenceDataError);

            return response.Payload.Body?.FirstOrDefault();
        }

        /// <inheritdoc />
        public async Task<List<PackageTheme>> GetThemes(string language)
        {
            var request = new PackageThemesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.PackageThemes, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<PackageThemesRequest, PackageThemesResponce>(
                request, ApiExceptionCodes.PackageThemesReferenceDataError);

            return response.Payload.Body?.Themes.ToList();
        }

        /// <inheritdoc />
        public async Task<TransferInfo> GetTransferInfoByProductId(string productId, string languageCode)
        {
            var request = new TransferInstructionsRequest
            {
                ProductId = productId,
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetHolidayTransferByProductId, Cookies())
            };
            request.SetQueryString();
            request.WithScLang(languageCode);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<TransferInstructionsRequest, TransferInstructionsResponse>(
                request, ApiExceptionCodes.TransfersReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, int>> GetAllTransferDurations()
        {
            var request = new TransferDurationsRequest
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllTransferDurations, Cookies())
            };

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<TransferDurationsRequest, TransferDurationsResponse>(
                request, ApiExceptionCodes.TransfersReferenceDataError);

            return response.Payload.Body;
        }

        public async Task<SpecialRequests> GetAllSpecialRequests(string language)
        {
            var request = new SpecialRequestsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllSpecialRequests, Cookies());
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<SpecialRequestsRequest, SpecialRequestsResponse>(
                request, ApiExceptionCodes.SpecialRequestsReferenceDataError);

            return response.Payload.Body;
        }

        /// <inheritdoc />
        public async Task<List<DestinationItem>> GetAllDestinations(bool showOnSearchPodOnly, string language)
        {
            var showOnDropdownOnly = true; // always true for current API needs

            var request = new Models.Destinations.Countries.CountriesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.DestinationCountries, Cookies());
            request.ShowOnSearchPod = showOnSearchPodOnly;
            request.ShouldGetItemsForDropdownOnly = showOnDropdownOnly;

            request.SetQueryString(null, new QueryStringOptions
            {
                UseBooleanString = true
            });
            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<Models.Destinations.Countries.CountriesRequest, DestinationsResponse>(
                request, ApiExceptionCodes.DestinationsSearchError);

            return response.Payload?.Body?.Destinations;
        }

        public async Task<List<FlightFilters>> GetFlightFilters(string language)
        {
            var request = new FlightFiltersRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetFlightFilters, Cookies());
            request.WithScLang(language);

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<FlightFiltersRequest, FlightFiltersResponse>(
                    request, ApiExceptionCodes.FlightFiltersError);

            return response.Payload?.Body?.FlightFilters;
        }

        public async Task<List<LivePriceSearch>> GetLivePriceSearches(string marketCode)
        {
            var request = new LivePriceSettingsRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetLivePrice, Cookies());
            request.Payload.Body = new LivePriceSettingsRequestBody { MarketCode = marketCode };

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<LivePriceSettingsRequest, LivePriceSettingsResponse>
                (request, ApiExceptionCodes.LivePriceSearchesGet);
            return response?.Payload?.Body?.NamedSearches;
        }


        /// <inheritdoc />
        public async Task<Luggage> GetLuggage(string language)
        {
            var request = new GetLuggageRequest()
            {
                Language = language,
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetLuggage, Cookies())
            };
            request.SetQueryString();

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<GetLuggageRequest, GetLuggageResponse>(
                request, ApiExceptionCodes.LuggageDataError);

            return response.Payload.Body;
        }

        /// <summary>
        /// Gets Facility Matrix Configuration From sitecore.
        /// </summary>
        /// <param name="language">current language.</param>
        /// <returns>List of configured matrix's in sitecore.</returns>
        public async Task<List<HotelTypeFilterConfiguration>> GetFacilityMatrixConfiguration(string language)
        {
            var request = new FacilityMatrixRequest
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.FacilityMatrixConfiguration, Cookies())
            };

            request.WithScLang(language);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<FacilityMatrixRequest, FacilityMatrixResponse>(
                request, ApiExceptionCodes.DestinationsSearchError);

            return response.Payload?.Body;
        }

        /// <summary>
        /// Gets Offer Filters Reordering Configuration From sitecore.
        /// </summary>
        /// <param name="language">Language.</param>
        /// <returns>Filters Reordering Configuration.</returns>
        public async Task<OfferFiltersReorderingConfiguration> GetOfferFiltersReorderingConfiguration(string language)
        {
            var request = new OfferFilterReorderingRequest()
            {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetOfferFiltersReorderingConfiguration, Cookies())
            };
            
            request.WithScLang(language);
            
            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<OfferFilterReorderingRequest, OfferFilterReorderingResponse>(
                request, ApiExceptionCodes.DestinationsSearchError);

            return response.Payload?.Body;
        }

        private IRequestCookieCollection Cookies()
        {
            return _httpContextAccessor?.HttpContext?.Request?.Cookies;
        }
    }
}
