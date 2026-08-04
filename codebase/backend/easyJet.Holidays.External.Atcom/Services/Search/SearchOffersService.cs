#nullable enable

using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Constants;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.InfoBooking;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Utils;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using AlternativeAccommodation = easyJet.Holidays.External.Atcom.Models.Internal.Search.AlternativeAccommodation;

namespace easyJet.Holidays.External.Atcom.Services.Search
{
    public class SearchOffersService
    {
        private static readonly string SearchCacheKey = "SearchCache";

        private readonly IApiService _apiService;
        private readonly EndpointsProvider _atcomEndpointProvider;
        private readonly SearchRequestsMapper _searchAvailablePackagesMapper;
        private readonly ICacheService _cacheService;
        private readonly AtcomSettings _atcomSettings;
        private readonly CacheSettings _cacheSettings;
        private readonly ISettingsService _settingsService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMarketService _marketService;
        private readonly ILogger<SearchOffersService> _logger;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IBoardService _boardService;
        private const string SearchRoomVariantsSearchType = "s_tp=6";
        private const string ListSearchType = "s_tp=3";
        private const string OfferSearchType = "s_tp=4";
        private const string AltHotelSearchType = "s_tp=23";

        public SearchOffersService(
            IBoardService boardService,
            IApiService apiService,
            EndpointsProvider atcomEndpointProvider,
            SearchRequestsMapper searchAvailablePackagesMapper,
            ICacheService cacheService,
            IOptions<AtcomSettings> atcomSettings,
            IOptions<CacheSettings> cacheSettings,
            ISettingsService settingsService,
            IHttpContextAccessor httpContextAccessor,
            IMarketService marketService,
            ILogger<SearchOffersService> logger,
            IReferenceDataService referenceDataService)
        {
            _apiService = apiService;
            _atcomEndpointProvider = atcomEndpointProvider;
            _searchAvailablePackagesMapper = searchAvailablePackagesMapper;
            _cacheSettings = cacheSettings.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _settingsService = settingsService;
            _cacheService = cacheService;
            _httpContextAccessor = httpContextAccessor;
            _marketService = marketService;
            _logger = logger;
            _referenceDataService = referenceDataService;
            _boardService = boardService;
        }

        /// <summary>
        /// Search Atcome cache
        /// </summary>
        /// <param name="request">Request data</param>
        /// <returns>Filtered client result and flag whether results came from cache</returns>
        public virtual async Task<(SearchAvailablePackagesResponse, bool)> DoSearch(PackagesSearchRequest request)
        {
            // StartDate
            // Duration
            // FlexibleDays
            // Departure
            // Geography
            // Child Ages
            // Room 
            // - Adults 
            // - Children
            // - Infants
            var searchRequest =
                _searchAvailablePackagesMapper.MapSearchRequest(request, _atcomSettings.EndpointTemplate.Search);

            //Add cache busting parameter to the query only for promo
            if (request.IsPromo.HasValue && request.IsPromo.Value)
            {
                await AddCacheBustingQueryParamForPromo(searchRequest);
            }

            var key = $"{searchRequest.QueryParams}&{SearchQueryUtils.BuildRoomAllocationQuery(request.Room.ToList())}";

            var marketBrand = _marketService.GetMarket(request.MarketCode)?.AtcomBrandCode;

            var fromCache = true;
            var response = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.SearchCache,
                new[] { $"{SearchCacheKey}_{key}", marketBrand }, async () =>
                {
                    fromCache = false;
                    return await DoSearch(
                        request,
                        searchRequest,
                        withRoomAllocation: !request.AutomaticAllocation
                    );
                }, false);

            _logger.LogInformation("DoSearch. Cache key: {CacheKey}. Found {Offers} results. From cache: {FromCache}",
             key, response?.Payload?.Body?.Result?.Offers?.Offer?.Length, fromCache);

            return (response, fromCache);
        }

        /// <summary>
        /// Do Atcom search request to get list of all offers by search criteria
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request"></param>
        /// <param name="searchRequest"></param>
        /// <param name="withRoomAllocation"></param>
        /// <returns></returns>
        public async Task<SearchAvailablePackagesResponse> DoSearch<T>(T request,
            SearchAvailablePackagesRequest searchRequest, bool withRoomAllocation = true) where T : BaseSearchRequest
        {
            if (withRoomAllocation && request.Room != null)
            {
                searchRequest.AddQueryString(SearchQueryUtils.BuildRoomAllocationQuery(request.Room.ToList()));
            }

            var response = await DoSearch(searchRequest, request.MarketCode, request.Ecp);

            GetRidOfZeroAdults(response);

            _logger.LogTrace("After get rid of zero adults left {count} offers", response?.Payload?.Body?.Result?.Offers?.Offer?.Count() ?? 0);

            return response;
        }

        /// <summary>
        /// Do Atcom search request to get list of all offers by search criteria
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="searchRequest"></param>
        /// <param name="marketCode"></param>
        /// <param name="ecp"></param>
        /// <returns></returns>
        public async Task<SearchAvailablePackagesResponse> DoSearch<T>(T searchRequest, string marketCode, string? ecp = null) 
            where T : AtcomApiRequest<object>
        {
            await AddPriceLimit(searchRequest);

            AddMarketBrandCodeParam(searchRequest, marketCode, ecp ?? string.Empty);
            AddNRef(searchRequest, ecp ?? string.Empty);
            
            searchRequest.Endpoint = _atcomEndpointProvider.GetSearchEndpointByMarket(marketCode, _httpContextAccessor?.HttpContext?.Request?.Cookies);

            _logger.LogDebug("Requesting offers from Atcom, using request: {Path}{Parameters}", searchRequest.Endpoint.AbsolutePath, searchRequest.QueryParams);

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<T,
                    SearchAvailablePackagesResponse>(
                    searchRequest, ApiExceptionCodes.SearchPackagesError);

            _logger.LogInformation("Received {Count} offers from Atcom", response?.Payload?.Body?.Result?.Offers?.Offer?.Length ?? 0);
            
            var offers = response?.Payload?.Body?.Result?.Offers?.Offer;

            if (offers is null)
                return response;
            
            foreach (var offer in offers.EmptyIfNull())
            {
                BoardUtils.EnrichAltBoards(offer);
                BoardUtils.MapAllBoards(offer);
            }

            if (IsSearchResultShouldGroupingByGiat(searchRequest.QueryParams))
            {
                _logger.LogTrace("Grouping offers by GIATA codes. Initial amount: {Count}", offers.Length);

                var groupedOffers = await GroupAccommodations(offers);
                offers = groupedOffers;

                _logger.LogTrace("There are bookings from different channels. After grouping {Count} unique offers left", offers.Length);
            }

            response!.Payload!.Body!.Result!.Offers!.Offer = offers;

            return response;
        }

        private void AddNRef<T>(T searchRequest, string provider) where T : AtcomApiRequest<object>
        {
            if (!string.IsNullOrEmpty(provider) && provider.Equals(ExperienceContextProviderConstants.FlightPlusHotel, StringComparison.OrdinalIgnoreCase) && searchRequest.QueryParams != null && (searchRequest.QueryParams.Contains(OfferSearchType, StringComparison.OrdinalIgnoreCase) || 
                searchRequest.QueryParams.Contains(SearchRoomVariantsSearchType, StringComparison.OrdinalIgnoreCase) || 
                searchRequest.QueryParams.Contains(ListSearchType, StringComparison.OrdinalIgnoreCase)))
            {
                searchRequest.AddQueryString(string.Format(CultureInfo.InvariantCulture, _atcomSettings.EndpointTemplate.NRefParam, B2BConstants.Yes));
            }
        }

        /// <summary>
        /// Add search price limit
        /// </summary>
        /// <param name="searchRequest"></param>
        private async Task AddPriceLimit<T>(T searchRequest) where T: AtcomApiRequest<object>
        {
            var priceLimitSettings = await _referenceDataService.GetPriceLimit();
            var priceType = priceLimitSettings?.IsPricePerPerson ?? true ? "PP" : "TP"; //PP by default
            var minPrice = priceLimitSettings?.MinPrice;
            var maxPrice = priceLimitSettings?.MaxPrice;
            
            if(searchRequest is SearchAvailablePackagesRequest packagesRequest)
            {
                packagesRequest.PriceType = priceType;
                packagesRequest.MinPrice = minPrice;
                packagesRequest.MaxPrice = maxPrice;
            }

            //preserve template that was originally used for updating query string
            searchRequest.SetQueryString(searchRequest.QueryStringTemplate);
        }

        /// <summary>
        /// Add cache busting parameter to the request query string
        /// </summary>
        /// <param name="searchRequest"></param>
        /// <returns>SearchAvailablePackagesRequest with filled corresponding property and updated query string</returns>
        private async Task AddCacheBustingQueryParamForPromo(SearchAvailablePackagesRequest searchRequest)
        {
            var promoCacheBusting = await _settingsService.GetPromoCacheBustingSetting();
            if (!string.IsNullOrWhiteSpace(promoCacheBusting?.QueryValue))
            {
                searchRequest.PromoCacheBusting = promoCacheBusting.QueryValue;
                searchRequest.SetQueryString(_atcomSettings.EndpointTemplate.Search);
            }
        }

        private void AddMarketBrandCodeParam<T>(T request, string marketCode, string provider) where T: AtcomApiRequest<object>
        {
            var marketBrandCode = !string.IsNullOrEmpty(provider) && provider.Equals(ExperienceContextProviderConstants.FlightPlusHotel, StringComparison.OrdinalIgnoreCase) 
                ? _marketService.GetMarket(marketCode)?.FPHAtcomBrandCode 
                : _marketService.GetMarket(marketCode)?.AtcomBrandCode;
            
            if (marketBrandCode != null)
            {
                request.AddQueryString(string.Format(_atcomSettings.EndpointTemplate.BrandParam, marketBrandCode));
            }
        }

        /// <summary>
        /// Get rid of offers which had zero adults in any room - it's valid offer for Atcom, but...
        /// </summary>
        /// <param name="response"></param>
        private static void GetRidOfZeroAdults(SearchAvailablePackagesResponse response)
        {
            var offers = response?.Payload?.Body?.Result?.Offers;
            if (offers == null || offers.Offer == null) return;

            offers.Offer = offers?.Offer?.Where(offer =>
            {
                var noUnitsWithZeroAdults =
                    offer.Accom?.SelectMany(x => x?.Unit)?.Select(x => x?.Occ)?.Any(x => x?.Ad == 0) == false;
                return noUnitsWithZeroAdults;
            })?.ToArray();
        }

        private async Task<AvCacheResultOffersOffer[]> GroupAccommodations(AvCacheResultOffersOffer[] offers)
        {
            if (offers == null)
                return Array.Empty<AvCacheResultOffersOffer>();

            var codes = offers.Select(offer => offer.Accom.First().Code);
            var mapping = await _referenceDataService.GetAccommodationToGiataMappings(codes);
            foreach (var offer in offers)
            {
                if (mapping.TryGetValue(offer.Accom.First().Code, out var giataCode))
                {
                    offer.GiataCode = giataCode;
                }
            }

            var withoutNullGiatas =
                offers.Where(x => !string.IsNullOrWhiteSpace(x.GiataCode)) // in case giata code for accom code mapping was not found
                    .GroupBy(x => x.GiataCode);

            var groupedOffers = new List<AvCacheResultOffersOffer>();
            foreach (var group in withoutNullGiatas)
            {
                IEnumerable<AvCacheResultOffersOffer> offersForSameHotel = group;
                if (offersForSameHotel.Any(x => x.Accom.First().Unit.First()?.SrcInfo?.System != _atcomSettings.RoomSystemsSettings.SystemToDiscard))
                {
                    offersForSameHotel = offersForSameHotel.Where(x =>
                        x.Accom.First().Unit.First()?.SrcInfo?.System !=
                        _atcomSettings.RoomSystemsSettings.SystemToDiscard);
                }

                // hotel has offer only from one of three sources (direct contract, HBG, TGX)
                if (offersForSameHotel.Count() == 1)
                {
                    groupedOffers.Add(offersForSameHotel.Single());
                    continue;
                }

                var (mergedOffer, errorMessage) = MergeOffersForSameHotel(offersForSameHotel);

                if (mergedOffer is null)
                {
                    _logger.LogWarning("Cannot merge offers for giata {giataCode}, accom codes {accomCodes} - {message}", group.Key,
                        string.Join(", ", offersForSameHotel.Select(x => x.Accom.First().Code)), errorMessage);
                    continue;
                }

                groupedOffers.Add(mergedOffer);
            }

            return groupedOffers.ToArray();
        }

        /// <summary>
        /// Merge offers from several systems for same hotel (currently the only possible combination is direct contract + TGX).
        /// To merge offers choosing offer based on direct contract's default board and merging alternative boards from both offers.
        /// </summary>
        /// <returns></returns>
        public (AvCacheResultOffersOffer? mergedOffer, string? errorMessage) MergeOffersForSameHotel(IEnumerable<AvCacheResultOffersOffer> offers)
        {
            try
            {
                var directOffer = offers.SingleOrDefault(x => x.GetSystem() is null);

                if (directOffer is null)
                    return (null, $"Direct offer not found");

                var tgxOffer = offers.SingleOrDefault(x => x.GetSystem() == "TGX");

                if (tgxOffer is null)
                    return (null, $"TGX offer not found");

                var directOfferDefaultBoard = directOffer.GetSelectedBoardCode();

                // prioritizing dynamic over direct contract if is the same board
                // if tgx offer has direct offer's default board as alternative board then select it,
                if (_boardService.AnyAlternateBoardsContainBoardCode(tgxOffer.AltBoard, directOfferDefaultBoard))
                {
                    _boardService.SelectBoard(tgxOffer, directOfferDefaultBoard);
                }

                AvCacheResultOffersOffer? offer = null;
                var tgxOfferDefaultBoard = tgxOffer.GetSelectedBoardCode();
                var allAlternativeBoards = directOffer.AltBoard.EmptyIfNull().Union(tgxOffer.AltBoard.EmptyIfNull()).ToList();

                if (_boardService.BoardCodesAreEqual(directOfferDefaultBoard, tgxOfferDefaultBoard))
                {
                    offer = directOffer.Price < tgxOffer.Price ? directOffer : tgxOffer;
                }
                else
                {
                    offer = directOffer;
                    allAlternativeBoards.Add(_boardService.GetSelectedBoard(tgxOffer));
                }

                allAlternativeBoards = allAlternativeBoards
                    .OrderBy(x => x.Price)
                    .ToList();

                var boardCodes = new HashSet<string>() { _boardService.GetBoardGroupOrCode(offer.GetSelectedBoardCode()) };
                var alternativeBoards = new List<AvCacheResultOffersOfferBoard>();

                foreach (var board in allAlternativeBoards)
                {
                    var boardCode = _boardService.GetBoardGroupOrCode(board.Code);
                    if (boardCodes.Contains(boardCode))
                        continue;

                    alternativeBoards.Add(board);
                    boardCodes.Add(boardCode);
                }

                offer.AltBoard = alternativeBoards.ToArray();
                offer.AlternativeAccommodations = offers
                    .Where(x => x != offer)
                    .Select(x => new AlternativeAccommodation
                    {
                        Code = x.Accom.First().Code,
                        PackageId = x.Accom.First().AtcomId
                    })
                    .ToList();

                return (offer, null);
            }
            catch (Exception ex)
            {
                // misconfigured hotels can have several direct accoms for same giata code
                return (null, ex.Message);
            }
        }

        /// <summary>
        /// Determines whether the search results should be grouped by GIATA codes based on the query parameters.
        /// </summary>
        /// <param name="queryParams">The query parameters used in the search request.</param>
        /// <returns>
        /// A boolean value indicating whether the search results should be grouped by GIATA codes.
        /// Returns <c>true</c> if the query parameters contain specific search types; otherwise, <c>false</c>.
        /// </returns>
        private static bool IsSearchResultShouldGroupingByGiat(string queryParams)
        {
            return queryParams.Contains(AltHotelSearchType, StringComparison.OrdinalIgnoreCase) ||
                   queryParams.Contains(ListSearchType, StringComparison.OrdinalIgnoreCase);
        }
    }
}