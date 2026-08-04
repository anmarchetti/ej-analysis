using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.Hotels.Facilities;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Cms.Models;
using easyJet.Holidays.External.Cms.Models.Facilities;
using easyJet.Holidays.External.Cms.Models.Hotels;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using LocationPoint = easyJet.Holidays.External.Cms.Models.Hotels.LocationPoint;

namespace easyJet.Holidays.External.Cms.Services
{
    public class HotelsSearchService : IHotelsService
    {
        private static readonly string HotelDetailsCacheKey = "CmsHotel";
        private static readonly string HotelCodesCacheKey = "CmsHotelCodes";
        private static readonly string HotelTransfersCacheKey = "CmsHotelTransfers";
        private static readonly string FacilitiesCacheKey = "FacilitiesCache";
        private const string HotelMapsCacheKey = "CmsMapsCoordinates";

        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAirportsMapper _airportsMapper;
        private readonly ILogger<HotelsSearchService> _logger;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly EnvironmentBehaviourSettings _envSettings;
        private readonly AtcomSettings _atcomSettings;
        private readonly SmartSeerSettings _smartSeerSettings;
        private readonly ILanguageService _languageService;

        public HotelsSearchService(
            IApiService apiService,
            EndpointsProvider endpointsProvider,
            IReferenceDataService referenceDataService,
            ICacheService cacheService,
            IOptions<CacheSettings> cacheSettings,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            IHttpContextAccessor httpContextAccessor,
            IOptions<AtcomSettings> atcomSettings,
            ILogger<HotelsSearchService> logger,
            IOptions<SmartSeerSettings> smartSeerTravelSettings,
            ILanguageService languageService,
            IOfferHotelMapper offerHotelMapper,
            IAirportsMapper airportsMapper)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _referenceDataService = referenceDataService;
            _offerHotelMapper = offerHotelMapper;
            _airportsMapper = airportsMapper;

            _cacheService = cacheService;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _envSettings = envSettings.Value ?? throw new ArgumentNullException(nameof(envSettings));
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _smartSeerSettings = smartSeerTravelSettings.Value ?? throw new ArgumentNullException(nameof(smartSeerTravelSettings));

            _logger = logger;
            _httpContextAccessor = httpContextAccessor;

            _languageService = languageService;
        }

        /// <inheritdoc />
        public Task<IEnumerable<Hotel>> Search(string[] atcomIds)
        {
            var lang = _languageService.GetCurrentLanguage() ?? string.Empty;
            return SearchForHotelWithCache(atcomIds, lang);
        }

        /// <inheritdoc />
        public Task<IEnumerable<Hotel>> Search(string[] atcomIds, string langCode)
        {
            if (langCode == null)
            {
                return Search(atcomIds);
            }

            return SearchForHotelWithCache(atcomIds, langCode);
        }

        /// <inheritdoc />
        public async Task<Hotel> SearchWithRoomsAndBoards(string atcomId, string roomCode, string boardCode)
        {
            IEnumerable<Hotel> hotels = await Search(new[] { atcomId });
            Hotel hotel = hotels.FirstOrDefault();
            if (hotel == null)
            {
                return null;
            }
            if (!string.IsNullOrEmpty(roomCode) && hotel.RoomTypes?.Any(x => x.Code == roomCode) != true)
            {
                var roomType = await _referenceDataService.GetRoomType(roomCode);
                if (roomType != null)
                {
                    hotel.RoomTypes = (hotel.RoomTypes ?? new Holidays.Api.Domain.Data.Hotels.RoomType[0]).Concat(new[]
                    {
                        OfferHotelMapper.MapReferenceDataRoomTypeToHotelRoom(roomType)
                    });
                }
            }
            if (!string.IsNullOrEmpty(boardCode) && hotel.BoardTypes?.Any(x => x.Code == boardCode) != true)
            {
                var boardType = await _referenceDataService.GetBoardType(boardCode);
                if (boardType != null)
                {
                    hotel.BoardTypes = (hotel.BoardTypes ?? new Holidays.Api.Domain.Data.Hotels.BoardType[0]).Concat(
                        new[]
                        {
                            OfferHotelMapper.MapReferenceDataBoardTypeToHotelBoard(boardType)
                        });
                }
            }

            // Set SmartSeer Theme Type Code per the first assigned promo collection (Luxury)
            if (hotel.PromoCollections != null && hotel.PromoCollections.Count != 0)
            {
                var promCollections = (await _referenceDataService.GetPromotionCollections())?.Promotions;
                hotel.SmartSeerThemeTypeCode = promCollections?.FirstOrDefault()?.PromotionCodes;
            }

            // fallback to the highest priority type code then
            if (string.IsNullOrEmpty(hotel.SmartSeerThemeTypeCode) && !string.IsNullOrEmpty(hotel.HighestPriorityType?.Code))
            {
                hotel.SmartSeerThemeTypeCode = $"{_smartSeerSettings.HotelThemeTypePreffix}{hotel.HighestPriorityType.Code}";
            }

            return hotel;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<IEnumerable<HotelTransfer>>> GetHotelTransfers(string[] atcomIds)
        {
            // Use the same cache strategy as for SearchHotels, because it's actually version of it, but more efficient
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            var key = new[] { HotelTransfersCacheKey, lang }.Concat(atcomIds).ToArray();
            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CmsHotels, key, async () =>
            {
                if (!atcomIds.Any())
                {
                    return new List<List<HotelTransfer>>();
                }

                var searchRequest = new HotelTransfersRequest();
                searchRequest.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetHotelTransfers,
                    _httpContextAccessor?.RequestCookies());
                searchRequest.Payload.Body = new HotelsSearchRequestBody
                {
                    AtcomIds = atcomIds.ToArray()
                };

                var response = await _apiService
                    .GetResponseContentAsyncWithErrorMapping<HotelTransfersRequest, HotelTransfersResponse>(
                        searchRequest, ApiExceptionCodes.SearchHotelsError);

                return response.Payload?.Body ?? new List<List<HotelTransfer>>();
            }, false);
        }

        private Task<IEnumerable<Hotel>> SearchForHotelWithCache(string[] atcomIds, string lang)
        {
            if (_envSettings.Performance.HotelsCacheUseSingleEntry)
            {
                return SearchUsingSingleCacheEntry(lang, atcomIds);
            }
            else
            {
                return SearchUsingIndividualCacheEntry(lang, atcomIds);
            }
        }

        /// <summary>
        /// Perf expirement: keep hotelss as individual cache entries
        /// </summary>
        /// <param name="atcomIds"></param>
        /// <returns></returns>
        private async Task<IEnumerable<Hotel>> SearchUsingIndividualCacheEntry(string lang, string[] atcomIds)
        {
            var hotels = await _cacheService.GetOrAddMultipleAsync<Hotel>(
                _cacheSettings.Buckets.CmsHotels,
                new[] { HotelDetailsCacheKey, lang },
                atcomIds,
                hotel => hotel.Code,
                async ids =>
                {
                    if (!ids.Any())
                    {
                        return new Hotel[0];
                    }

                    var searchRequest = new HotelsSearchRequest();
                    searchRequest.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.SearchHotels,
                        _httpContextAccessor?.RequestCookies());
                    searchRequest.Payload.Body = new HotelsSearchRequestBody
                    {
                        AtcomIds = ids.ToArray()
                    };

                    searchRequest.WithScLang(lang);

                    var response = await _apiService
                        .GetResponseContentAsyncWithErrorMapping<HotelsSearchRequest, HotelsSearchResponse>(
                            searchRequest, ApiExceptionCodes.SearchHotelsError);

                    return response.Payload?.Body?.Hotels;
                },
                false
            );

            return hotels;
        }

        /// <summary>
        /// Perf expirement: keep hotels as single dictionary
        /// </summary>
        /// <param name="atcomIds"></param>
        /// <returns></returns>
        private async Task<IEnumerable<Hotel>> SearchUsingSingleCacheEntry(string lang, string[] atcomIds)
        {
            if (atcomIds == null || !atcomIds.Any())
            {
                return new List<Hotel>();
            }

            var notCachedIds = new List<string>(atcomIds.Length);
            var result = new List<Hotel>(atcomIds.Length);

            // This function is used in 2 places
            Func<Task<Dictionary<string, Hotel>>> getCachedHotels = async () =>
                await _cacheService.Get<Dictionary<string, Hotel>>(_cacheSettings.Buckets.CmsHotels,
                    new[] { HotelDetailsCacheKey, lang }) ?? new Dictionary<string, Hotel>();

            var hotelsByCodeFromCache = await getCachedHotels();

            // Split ids into 2 sets: cached and not cached
            atcomIds.ToList().ForEach(id =>
            {
                if (hotelsByCodeFromCache.ContainsKey(id))
                {
                    result.Add(hotelsByCodeFromCache[id]);
                }
                else
                {
                    notCachedIds.Add(id);
                }
            });

            if (notCachedIds.Any())
            {
                _logger.LogInformation(
                    $"Cache miss. Trying to load hotel details from CMS: {string.Join(",", notCachedIds)}");
                // Load missing data from CMS
                var hotelsFromCms = await GetHotelsByCodes(notCachedIds.ToArray(), lang);
                result.AddRange(hotelsFromCms);

                // Put it in cache
                await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CmsHotels, new[] { HotelDetailsCacheKey, lang },
                    async () =>
                    {
                        // We do it inside GetOrAddAsync because here it's thread-safe context and we can safely update cache
                        var cachedHotels = await getCachedHotels();

                        hotelsFromCms.ToList().ForEach(hotel => cachedHotels[hotel.Code] = hotel);

                        return cachedHotels;
                    },
                    // Use "Force cache update" because we want to update it, not replace. Otherwise it won't work
                    true);
            }

            return result;
        }

        public async Task<IEnumerable<Hotel>> GetHotelsByCodes(string[] ids, string lang = null)
        {
            if (!ids.Any())
            {
                return new Hotel[0];
            }

            var searchRequest = new HotelsSearchRequest();
            searchRequest.Endpoint =
                _endpointsProvider.GetEndpoint(CmsEndpoint.SearchHotels, _httpContextAccessor?.RequestCookies());
            searchRequest.Payload.Body = new HotelsSearchRequestBody
            {
                AtcomIds = ids.ToArray()
            };
            lang = lang ?? _languageService.GetCurrentLanguage();
            searchRequest.WithScLang(lang);
            var response =
                await _apiService.GetResponseContentAsyncWithErrorMapping<HotelsSearchRequest, HotelsSearchResponse>(
                    searchRequest, ApiExceptionCodes.SearchHotelsError);

            return response.Payload?.Body?.Hotels;
        }

        public async Task<Dictionary<string, List<Facility>>> GetFacilitiesForAccommodations(string[] codes)
        {
            var searchRequest = new FacilitiesSearchRequest();
            searchRequest.Endpoint =
                _endpointsProvider.GetEndpoint(CmsEndpoint.SearchFacilities, _httpContextAccessor?.RequestCookies());
            searchRequest.Payload.Body = new FacilitiesSearchRequestBody
            {
                AtcomIds = codes
            };

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<FacilitiesSearchRequest, FacilitiesSearchResponse>(
                    searchRequest, ApiExceptionCodes.SearchFacilitiesError);

            return response.Payload?.Body?.Facilities;
        }

        /// <summary>
        /// That's new version which caches all other entries individualy
        /// </summary>
        /// <param name="codes"></param>
        /// <returns></returns>
        public async Task<Dictionary<string, HotelFilters>> GetAllFiltersForAccommodations(string[] codes)
        {
            var lang = _languageService?.GetCurrentLanguage() ?? string.Empty;
            var hotelFilters = await _cacheService.GetOrAddMultipleAsync<HotelFilters>(
                _cacheSettings.Buckets.FacilitiesCache,
                new[] { FacilitiesCacheKey, lang },
                codes,
                filter => filter.Code,
                async ids =>
                {
                    if (!ids.Any())
                    {
                        return Array.Empty<HotelFilters>();
                    }

                    var searchRequest = new FiltersSearchRequest();
                    searchRequest.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetAllFilters,
                        _httpContextAccessor?.RequestCookies());
                    searchRequest.Payload.Body = new FiltersSearchRequestBody
                    {
                        AtcomIds = ids.ToArray()
                    };

                    _logger.LogTrace("Sending request: {method}, {endpoint}, {count}, ids: {ids}", searchRequest.Method, searchRequest.Endpoint, ids.Count, string.Join(",", ids));

                    var response = await _apiService
                        .GetResponseContentAsyncWithErrorMapping<FiltersSearchRequest, FiltersSearchResponse>(
                            searchRequest, ApiExceptionCodes.FlightFiltersError);

                    var filters = response.Payload?.Body;

                    filters?.ForEach(filter =>
                    {
                        // Re-group 
                        filter.FacilityGroups = filter.FacilityGroups != null
                            ? filter.FacilityGroups.Select(x =>
                            {
                                x.FacilityFilteredTypes =
                                    FacilityUtils.GroupFacility(x.FacilityFilteredTypes).ToList();
                                return x;
                            }).ToArray()
                            : Array.Empty<FacilityGroup>();

                        // Pre-calculate facility codes
                        filter.FacilitiesCodes = FacilityUtils.GetFacilityCodes(filter.FacilityGroups);
                    });

                    return filters;
                },
                false
            );

            return hotelFilters.GroupBy(h => h.Code).ToDictionary(x => x.Key, v => v.FirstOrDefault());
        }

        public async Task EnrichBookingResponse(Holidays.Api.Domain.Data.Booking.BookingResponse bookingResponse)
        {
            var accom = bookingResponse.Package.Accom;
            var fulladdress = accom.Hotel.FullHotelAddress;
            var hotel = await GetHotelWithFallback(accom.Code);

            // Update balance Due date
            BookingUtils.EnrichAllowPayBalanceDueDate(bookingResponse,
                _atcomSettings.AllowPayOutstandingBalanceIsGreaterThanDays);

            // Do some mappings for data
            if (hotel != null)
            {
                if (bookingResponse.Hotel == null)
                {
                    bookingResponse.Hotel = hotel;

                    var roomCodes = accom.Rooms.Select(x => x.Code);
                    var boardCodes = accom.Rooms.Select(x => x.Board);
                    bookingResponse.Hotel.RoomTypes = bookingResponse.Hotel?.RoomTypes?.Where(x => roomCodes.Contains(x.Code));
                    bookingResponse.Hotel.BoardTypes = bookingResponse.Hotel?.BoardTypes?.Where(x => boardCodes.Contains(x.Code));
                }

                bookingResponse.Package.Accom.Hotel = await _offerHotelMapper.MapWithoutBoardsRooms(hotel, bookingResponse.Prom);
                UpdateFullHotelAddressInformation(bookingResponse, fulladdress, hotel);
                foreach (var room in bookingResponse.Package.Accom.Rooms)
                {
                    await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotel, room);
                }

                await _airportsMapper.EnrichAirportDetails(new List<Offer>()
                {
                    new Offer
                    {
                        Location = bookingResponse.Package.Location,
                        Transport = bookingResponse.Package.Transport
                    }
                });

                await TransfersServiceUtils.EnrichCmsData(bookingResponse.Transfers, bookingResponse.Package.Transport,
                    hotel.Transfers, _referenceDataService);
            }
            else
            {
                _logger.LogError("No hotel data for accommodation: {AccomCode}", accom);
            }
        }

        private void UpdateFullHotelAddressInformation(BookingResponse bookingResponse, FullHotelAddress fulladdress, Hotel hotel)
        {
            bookingResponse.Package.Accom.Hotel.FullHotelAddress = fulladdress;
            bookingResponse.Package.Accom.Hotel.FullHotelAddress.Country = hotel.Country.Name;
        }

        private async Task<Hotel> GetHotelWithFallback(string accomCode)
        {
            var localizedHotels = await Search(new[] { accomCode });
            var hotel = localizedHotels.FirstOrDefault();

            if (hotel == null)
            {
                var defaultLangHotels = await Search(new[] { accomCode }, _languageService.GetDefaultLanguage());
                hotel = defaultLangHotels.FirstOrDefault();
            }

            return hotel;
        }


        public async Task<List<HotelSummary>> GetHotelsSummary(string code)
        {
            var lang = _languageService.GetCurrentLanguage();
            var data = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.CmsHotelMapCoordinates, new[] { code, lang }, async () =>
            {
                var searchRequest = new HotelsSummaryRequest();
                searchRequest.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.SearchHotelsSummary,
                    _httpContextAccessor?.RequestCookies());
                searchRequest.Code = code;
                searchRequest.SetQueryString();
                searchRequest.WithScLang(lang);

                var response = await _apiService
                    .GetResponseContentAsyncWithErrorMapping<HotelsSummaryRequest, HotelsSummaryResponce>(
                        searchRequest, ApiExceptionCodes.SearchHotelsSummaryByParentCode);

                return response.Payload?.Body;
            }, false);

            return data;
        }

        public async Task<List<HotelSummary>> GetPolygonHotelsSummary(Point topLeftAngle, Point bottomRightAngle)
        {
            var polygonRequest = new PolygonHotelsRequest();
            polygonRequest.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.SearchPolygonHotelsSummary,
                _httpContextAccessor?.RequestCookies());
            polygonRequest.Payload.Body = new PolygonHotelsRequestBody
            {
                TopLeftAngle = new LocationPoint()
                {
                    Latitude = topLeftAngle.Latitude,
                    Longitude = topLeftAngle.Longitude,
                },
                BottomRightAngle = new LocationPoint()
                {
                    Latitude = bottomRightAngle.Latitude,
                    Longitude = bottomRightAngle.Longitude,
                }
            };

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<PolygonHotelsRequest, PolygonHotelsResponce>(
                    polygonRequest, ApiExceptionCodes.SearchHotelsSummaryByParentCode);

            return response.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<List<string>> GetMissingCodes(IEnumerable<string> atcomIds)
        {
            var hotelCodes = await _referenceDataService.GetHotelCodes();
            if (hotelCodes == null || !hotelCodes.Any())
            {
                // it shouldn't happen, but if cache is empty we assume that everythigng exists
                return new List<string>();
            }
            return atcomIds.Except(hotelCodes).ToList();
        }

        /// <inheritdoc />
        public async Task<string[]> GetHotelsCodes(HotelsCodesRequest args)
        {
            var hotelsCodesRequest = new HotelsCodesSearchRequest();
            hotelsCodesRequest.Endpoint =
                _endpointsProvider.GetEndpoint(CmsEndpoint.GetHotelsCodes, _httpContextAccessor?.RequestCookies());

            hotelsCodesRequest.Take = args.Take;
            hotelsCodesRequest.Page = args.Page;
            hotelsCodesRequest.LastUpdated = args.LastUpdated;
            hotelsCodesRequest.SetQueryString();

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<HotelsCodesSearchRequest, HotelsCodesSearchResponse>(
                    hotelsCodesRequest, ApiExceptionCodes.HotelsCodesSearchError);

            return response.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<HotelResortInfo> GetHotelResortInfoByHotelCode(string code)
        {
            var request = new HotelResortInfoRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetHotelResortInfoByHotelCode,
                _httpContextAccessor.HttpContext.Request.Cookies);

            request.Code = code;
            request.SetQueryString();

            var response =
                await _apiService
                    .GetResponseContentAsyncWithErrorMapping<HotelResortInfoRequest, HotelResortInfoResponse>(request,
                        ApiExceptionCodes.HotelResortInfoCodeError);

            return response?.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<HotelHighlightsData>> GetHotelHighlights(string code)
        {
            var request = new HotelResortInfoRequest {
                Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetHotelHighlightsByHotelCode,
                    _httpContextAccessor.HttpContext.Request.Cookies),
                Code = code
            };

            request.SetQueryString();

            var response =
                await _apiService
                    .GetResponseContentAsyncWithErrorMapping<HotelResortInfoRequest, HotelHighlightsResponse>(request,
                        ApiExceptionCodes.HotelResortInfoCodeError);

            return response?.Payload?.Body;
        }

        /// <inheritdoc />
        public async Task<List<FeaturedFacility>> GetFeaturedFacilitiesByHotelCode(string code)
        {
            var request = new FeaturedFacilitiesRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(CmsEndpoint.GetFeaturedFacilitiesByHotelCode,
                _httpContextAccessor?.RequestCookies());

            request.Code = code;
            request.SetQueryString();

            var response =
                await _apiService
                    .GetResponseContentAsyncWithErrorMapping<FeaturedFacilitiesRequest, FeaturedFacilitiesResponse>(
                        request, ApiExceptionCodes.FeaturedFacilitiesCodeError);

            return response?.Payload?.Body;
        }

        /// <summary>
        /// Gets the accomodations by giata.
        /// </summary>
        /// <param name="giataCodes"></param>
        /// <param name="lang">The lang.</param>
        /// <returns>A Task.</returns>
        public async Task<Dictionary<string, HashSet<string>>> GetAccomodationsByGiata(IList<string> giataCodes, string lang = null)
        {
            var searchRequest = new AccomodationsSearchRequest();
            searchRequest.Endpoint =
                _endpointsProvider.GetEndpoint(CmsEndpoint.SearchAccomodations, _httpContextAccessor?.RequestCookies());
            searchRequest.Payload.Body = new AccomodationsSearchRequestBody
            {
                Codes = giataCodes
            };
            lang = lang ?? _languageService.GetCurrentLanguage();
            searchRequest.WithScLang(lang);

            var response =
                await _apiService
                .GetResponseContentAsyncWithErrorMapping<AccomodationsSearchRequest, AccomodationSearchResponse>(searchRequest, ApiExceptionCodes.SearchAccommodationsByGiata);
            return response?.Payload?.Body;
        }
    }
}