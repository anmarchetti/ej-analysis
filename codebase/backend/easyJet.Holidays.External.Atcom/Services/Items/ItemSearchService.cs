using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Mappers.ItemSearch;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text.RegularExpressions;
using CarPark = easyJet.Holidays.External.Atcom.Models.Internal.CarPark;
using ItemSearchRequest = easyJet.Holidays.External.Atcom.Models.ItemSearch.ItemSearchRequest;
using ItemSearchResponse = easyJet.Holidays.External.Atcom.Models.InfoBooking.ItemSearchResponse;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;

namespace easyJet.Holidays.External.Atcom.Services.Items
{
    public class ItemSearchService : IItemSearchService
    {
        private readonly IApiService _apiService;
        private readonly AtcomRequestGenerator _atcomRequestGenerator;
        private readonly EndpointsProvider _atcomRequestBuilder;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AtcomSettings _atcomSettings;
        private readonly ICacheService _cacheService;
        private readonly CacheSettings _cacheSettings;
        private readonly ILogger<ItemSearchService> _logger;


        /// <summary>
        /// Constructor to init dependencies
        /// </summary>
        /// <param name="apiService"></param>
        /// <param name="atcomRequestGenerator"></param>
        /// <param name="atcomRequestBuilder"></param>
        /// <param name="httpContextAccessor"></param>
        /// <param name="atcomSettings"></param>
        /// <param name="cmsSettings"></param>
        /// <param name="cacheService"></param>
        /// <param name="logger"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public ItemSearchService(
            IApiService apiService,
            AtcomRequestGenerator atcomRequestGenerator,
            EndpointsProvider atcomRequestBuilder,
            IHttpContextAccessor httpContextAccessor,
            IOptions<AtcomSettings> atcomSettings,
            IOptions<CacheSettings> cmsSettings,
            ICacheService cacheService,
            ILogger<ItemSearchService> logger
            )
        {
            ArgumentNullException.ThrowIfNull(atcomSettings);
            ArgumentNullException.ThrowIfNull(cmsSettings);
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
            _cacheSettings = cmsSettings.Value ?? throw new ArgumentNullException(nameof(cmsSettings));
            _apiService = apiService;
            _atcomRequestGenerator = atcomRequestGenerator;
            _atcomRequestBuilder = atcomRequestBuilder;
            _httpContextAccessor = httpContextAccessor;
            _cacheService = cacheService;
            _logger = logger;
        }

        /// <inheritdoc />
        private async Task<IEnumerable<Models.Internal.Item>> Get(Offer offer, string typeCode = null)
        {
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(true, offer.PromotionCollections);
            var atcomRequest = ItemSearchMapper.BuildRequest(offer, cltInfo);

            var searchRequest = new ItemSearchRequest();
            searchRequest.Payload.Body = atcomRequest;
            searchRequest.Endpoint = _atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies);

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<ItemSearchRequest, ItemSearchResponse>(
                 searchRequest, ApiExceptionCodes.ItemSearchRequestError
            );

            var allItemSets = response?.Payload?.Body?.Offers?.SelectMany(x => x?.Item_Set ?? new Models.Internal.Item_Set[0])?.ToList();
            var allItems = allItemSets?.SelectMany(x => x.Item ?? new Models.Internal.Item[0]);

            return allItems;
        }

        /// <inheritdoc />
        public async Task<OfferExtras> GetExtras(Offer offer)
        {
            var adults = offer.Accom.Unit.Sum(x => x.Occupation.Adults);
            var children = offer.Accom.Unit.Sum(x => x.Occupation.Children);
            var infants = offer.Accom.Unit.Sum(x => x.Occupation.Infants);
            var inbound = offer.Transport?.Routes[1].DepDate;
            var outbound = offer.Transport?.Routes[0].DepDate;
            var accomCode = offer.Accom.Code;
            string cacheKey = $"{accomCode}_{outbound}_{inbound}_{adults}_{children}_{infants}";

            return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.Extras, new[] { cacheKey }, async () =>
            {
                _logger.LogTrace("Cache miss. Getting items types data from database");
                var searchResult = await Get(offer);
                var items = ItemsMapper.Map(searchResult, offer.Currency, _atcomSettings?.Transfers?.SurchargeSettings);

                var transfers = items.Where(x => x.TypeCode == _atcomSettings.Extras.TransferTypeCode);
                var lateRoomCheckouts = items.Where(x => x.TypeCode == _atcomSettings.Extras.LateCheckoutType).Select(x => new LateRoomCheckoutItem(x));

                return new OfferExtras
                {
                    Transfers = ItemsMapper.MapTransfers(transfers, _atcomSettings.Transfers.Types),
                    LateRoomCheckout = lateRoomCheckouts.FirstOrDefault()
                };
            }, false);
        }

        /// <inheritdoc />
        public async Task<IList<AirportParkingItem>> GetAirportParkings(Offer offer)
        {
            ArgumentNullException.ThrowIfNull(offer);

            var airportParkingItems = new List<AirportParkingItem>();
            ItemSearchRequest searchRequest = CreateParkingItemSearchRequest(offer);

            ItemSearchResponse response = await _apiService.GetResponseContentAsyncWithErrorMapping<ItemSearchRequest, ItemSearchResponse>(searchRequest, ApiExceptionCodes.ItemSearchRequestError);

            List<Item_Set> allItemSets = response?.Payload?.Body?.Offers?.SelectMany(x => x?.Item_Set ?? []).ToList();
            IEnumerable<Item> allItems = allItemSets?.SelectMany(x => x.Item ?? []);

            if (allItems == null)
                return airportParkingItems;

            foreach (Item item in allItems)
            {
                AirportParkingItem airportParkingItem = AirportParkingMapper.MapResponseToAirportParking(item);
                airportParkingItems.Add(airportParkingItem);
            }

            return airportParkingItems;
        }

        private ItemSearchRequest CreateParkingItemSearchRequest(Offer offer)
        {
            Models.Internal.ItemSearchRequest itemSearchRequest = ItemSearchMapper.BuildRequest(offer, _atcomRequestGenerator.BuildCurrentCltInfo(true, offer.PromotionCollections));
            itemSearchRequest.Item_Search_Type = [
                new Item_Search_Type
                {
                    Value = Item_Search_Type_Base.AIRPORT_ANCILLARIES_PARKING,
                    ExternalSearch = true,
                    ExternalSearchSpecified = true
                }
            ];

            var searchRequest = new ItemSearchRequest
            {
                Payload = { Body = itemSearchRequest },
                Endpoint = _atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies)
            };

            return searchRequest;
        }
    }
}
