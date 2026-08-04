using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Hotels;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Mappers;
using easyJet.Holidays.Api.Domain.Services.Extras;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Extensions;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.InfoBooking;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using easyJet.Holidays.External.Atcom.Models.Search;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using easyJet.Holidays.External.Atcom.Utils;
using Force.DeepCloner;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.Atcom.Services.Search
{
    /// <summary>
    /// Accommodation offers service: rooms, flights etc
    /// </summary>
    public class AccommodationOfferService : IAccommodationOfferService
    {
        private readonly AtcomSettings _atcomSettings;
        private readonly SearchSettings _searchSettings;
        private readonly IHotelsService _hotelsService;
        private readonly SearchRequestsMapper _searchRequestsMapper;
        private readonly IHotelOfferService _hotelOfferService;
        private readonly ILogger<AccommodationOfferService> _logger;
        private readonly ITransferService _transferServce;
        private readonly SearchOffersService _searchOffersService;
        private readonly IPromotionValidatorService _promotionValidatorService;
        private readonly ApiSettings _apiSettings;
        private readonly IExtrasService _extrasService;
        private readonly IMarketService _marketService;
        private readonly IOffersMapper _offersMapper;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAirportsMapper _airportsMapper;
        private readonly IBoardService _boardService;
        private readonly SearchAvailablePackagesFilterAndMapper _searchAvailablePackagesFilterAndMapper;

        public AccommodationOfferService(
            IOptions<AtcomSettings> atcomSettings,
            IHotelsService hotelsService,
            SearchRequestsMapper searchRequestsMapper,
            IHotelOfferService hotelOfferService,
            IOptions<SearchSettings> searchSettings,
            ILogger<AccommodationOfferService> logger,
            ITransferService transferServce,
            SearchOffersService searchOffersService,
            IPromotionValidatorService promotionValidatorService,
            IOptions<ApiSettings> apiSettings,
            IExtrasService extrasService,
            IMarketService marketService,
            IOffersMapper offersMapper,
            IOfferHotelMapper offerHotelMapper,
            IAirportsMapper airportsMapper,
            SearchAvailablePackagesFilterAndMapper searchAvailablePackagesFilterAndMapper,
            IBoardService boardService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _searchSettings = searchSettings.Value ?? throw new ArgumentNullException(nameof(searchSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _searchRequestsMapper = searchRequestsMapper;
            _hotelsService = hotelsService;
            _logger = logger;
            _hotelOfferService = hotelOfferService;
            _transferServce = transferServce;
            _searchOffersService = searchOffersService;
            _promotionValidatorService = promotionValidatorService;
            _extrasService = extrasService;
            _marketService = marketService;
            _offersMapper = offersMapper;
            _offerHotelMapper = offerHotelMapper;
            _airportsMapper = airportsMapper;
            _searchAvailablePackagesFilterAndMapper = searchAvailablePackagesFilterAndMapper;
            _boardService = boardService;
        }

        /// <summary>
        /// Do Atcom search type 6 request to build accommodation offer.
        /// It ignores all offeres except first one because otherwise it can't merge results properly.
        /// The reason or merginng is that s_tp=6 doesn't support multiple rooms, only single room.
        /// </summary>
        /// <param name="request">Request model</param>
        /// <returns>Collection of accommodation offers</returns>
        public async Task<SearchOffersResponse> SearchAccommodationOffer(AccommodationOfferRequest request)
        {
            // To call only the one source
            request.AlternativeAccomodations = Array.Empty<AlternativeAccomodation>();

            var totalPassengers = request.TotalGuests();
            var roomAllocationOffers = await GetRoomAllocationOffers(request);

            if (IsIncorrectRoomCodeForBoard(roomAllocationOffers, request.BoardType))
            {
                roomAllocationOffers = await RequestOffersWithIncorrectCode(request);
            }

            var marketSettings = _marketService.GetMarket(request.MarketCode);
            var mappedResponses = await MapSearchOffersResponse(roomAllocationOffers
                .Select(offers => CreateSearchResponse(offers.Offers)), marketSettings);

            KeepOnlyFirstOfferAndRemoveAltBoards(mappedResponses);

            var result = SearchAvailablePackagesAggregator.AggregateSingleUnitAccommodation(
                mappedResponses, totalPassengers)
                ?? new SearchOffersResponse { Offers = new List<Offer>() };

            // Fix prices for transfers
            await FixPriceForTransfers(result.Offers, request);

            // Late room checkout
            if (request.LateRoomCheckout)
            {
                await AddLateRoomCheckoutPrice(result.Offers);
            }

            return result;
        }

        /// <summary>
        /// Take only first offer and ignore others. It's fine here, otherwise we can't merge them
        /// </summary>
        private static void KeepOnlyFirstOfferAndRemoveAltBoards(IEnumerable<SearchOffersResponse> responses)
        {
            foreach (var resp in responses.Where(x => x.Offers?.Count > 0))
            {
                if (resp.Offers.Count > 1)
                {
                    resp.Offers = resp.Offers.Take(1).ToList();
                }

                resp.Offers[0].AltBoards = null;
            }
        }

        private async Task AddLateRoomCheckoutPrice(IEnumerable<Offer> offers)
        {
            foreach (var offer in offers)
            {
                var extras = await _extrasService.Get(offer);
                if (extras.LateRoomCheckout != null)
                {
                    var lateItem = extras.LateRoomCheckout;
                    offer.LateRoomCheckout = lateItem;

                    offer.AddPrice(lateItem.Price);

                    offer.AltBoards?.ForEach(x =>
                    {
                        x.AddPrice(lateItem.Price);
                    });
                }
            }
        }

        private async Task FixPriceForTransfers(IEnumerable<Offer> offers, RoomVariantsSearchRequest request)
        {
            foreach (var offer in offers)
            {
                var defaultTransferCode = offer.Transfers?.FirstOrDefault()?.Code;
                var transferWasUpdated = _hotelOfferService.SetOfferTransfer(offer, request.Transfer);

                if (transferWasUpdated)
                {
                    offer.DefaultTransferCode = string.IsNullOrEmpty(offer.DefaultTransferCode)
                        ? defaultTransferCode
                        : offer.DefaultTransferCode;

                    var transfers = await _transferServce.GetAll(offer);
                    var selectedTransfer = transfers.FirstOrDefault(x => x.Code == request.Transfer);
                    var defaultTransfer = transfers.FirstOrDefault(x => x.Code == defaultTransferCode);

                    if (selectedTransfer != null)
                    {
                        var delta = selectedTransfer.Price - (defaultTransfer?.Price ?? 0);
                        offer.AltBoards?.ForEach(altBoard =>
                        {
                            altBoard.AddPrice(delta);
                        });

                        // Update offer price based on transfers
                        offer.AddPrice(delta);

                        // First of all get rid of synthetic offers
                        offer.Transfers = offer.Transfers?.Where(x => !x.Code.StartsWith(_atcomSettings.Transfers.Types.SyntheticNoTransfer)).ToList();
                        // And get more info if neccessary
                        offer.Transfers = (await _transferServce.BuildTransfers(offer, false))?.ToList();
                    }
                }
                else
                {
                    // TODO: all this code should be removed once Atcom adds filter by non-default transfer +
                    // need to check if we can use s_tp=3 to get results without aggregation
                    if (offer.Accom.Unit.Count > 1)
                    {
                        await FixPriceBecauseOfTransfers(request, offer);
                    }
                }
            }
        }

        private bool IsIncorrectRoomCodeForBoard(RoomAllocationOffers[] roomAllocationOffers, string boardType)
        {
            // Only ext room code can be incorrect
            if (roomAllocationOffers.All(x =>
                string.IsNullOrEmpty(x.RoomAllocation.RoomCode) ||
                !OfferHotelMapper.IsExtRoomCode(x.RoomAllocation.RoomCode)))
            {
                return false;
            }

            var offers = roomAllocationOffers.Select(x => x.Offers.FirstOrDefault());

            return _boardService.AnyAlternateOffer(offers!, boardType);
        }

        private async Task<RoomAllocationOffers[]> RequestOffersWithIncorrectCode(AccommodationOfferRequest request)
        {
            var requestedRoomCodes = request.Room.Select(x => x.RoomCode).ToArray();

            foreach (var room in request.Room)
            {
                room.RoomCode = null;
            }

            // request offers without room code but filtered by board
            var roomOffers = await GetRoomAllocationOffers(request);

            for (var i = 0; i < request.Room.Count; i++)
            {
                if (roomOffers.Length <= i) continue;

                var requestedRoomCode = OfferHotelMapper.ParseRoomCode(requestedRoomCodes[i]);

                // find correct room code in offers
                var correctRoomCode = roomOffers[i].Offers
                    .FirstOrDefault(x => x.GetUnitCode()?.StartsWith(requestedRoomCode) == true)?.GetUnitCode();

                // if correct room code not found clear offers for room allocation
                if (correctRoomCode == null)
                {
                    roomOffers[i] = new RoomAllocationOffers(roomOffers[i].RoomAllocation,
                        Array.Empty<AvCacheResultOffersOffer>());
                }

                request.Room[i].RoomCode = correctRoomCode;
            }

            return roomOffers;
        }

        /// <inheritdoc />
        public async Task<AccommodationOffersResponse> BuildOffer(AccommodationOfferRequest request)
        {
            var response = await SearchAccommodationOffer(request);

            if (response == null || response.Offers == null || response.Offers.Count == 0)
            {
                // We should have at least 1 result if there is no other alternatives
                return new AccommodationOffersResponse
                {
                    Offers = new List<Offer>()
                };
            }

            // Load hotel details
            var accomCode = response.Offers.First().Accom.Code;
            var hotels = await _hotelsService.Search([accomCode]);
            var hotelModel = hotels.FirstOrDefault();

            // if there is no information in Sitecore - do not show offer info
            if (hotelModel == null)
            {
                var message = $"No hotel data for accommodation: {accomCode}";
                _logger.LogError(message);
                throw new ArgumentNullException(message);
            }

            var result = await _offerHotelMapper.BuildAccommodationOffers(hotelModel, response.Offers, request);

            result = await _promotionValidatorService.ExtendOffersWithPromotions(result, hotels);

            // Set airport names
            await _airportsMapper.EnrichAirportDetails(response.Offers);

            return result;
        }

        /// <summary>
        /// Do Atcom search type 6 request to get available offers for each room(guests allocation)
        /// </summary>
        /// <param name="request">Request model</param>
        /// <returns>Collection of accommodation offers</returns>
        public async Task<RoomVariantsResponse> RoomVariants(RoomVariantsSearchRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);

            if (request.Room == null || request.Room.Count == 0)
            {
                return new RoomVariantsResponse();
            }

            //back up request
            var requestRoomAllocations = request.Room.ToArray();
            var requestBoardType = request.BoardType;

            //open up the search
            request.Room = request.Room.Select(room => room.CloneWithEmptyRoomCode()).ToList();
            request.BoardType = null;

            // search
            var alternateOffersResponse = await GetRoomAllocationOffers(request);

            // if alternateOffers has matching external src info unit code, then take the unit code otherwise
            // take the room code from the request
            var roomCodes = requestRoomAllocations
                .Select((roomAlloc, i) => ResolveMappedRoomCode(roomAlloc.RoomCode, alternateOffersResponse[i].Offers))
                .ToArray();

            // find offers from roomAllocationOffers which contain units that match roomCodes
            var roomCodeOffers = FilterOffersByRoomCode(alternateOffersResponse, roomCodes);
            var currentContractAccomId = request.AccommodationId;

            var responses = alternateOffersResponse.Select((item, i) =>
            {
                var (roomAllocation, offers) = item;

                if (offers.Length == 0)
                {
                    return null;
                }

                // Atcom returns all offers with default board type, try to change to selected
                foreach (var offer in offers)
                {
                    TryChangeOfferBoardType(offer, requestBoardType);
                }

                // Temporary save all alternative boards from all offers
                var altBoards = _boardService.GetAllAlternativeBoards(offers, requestBoardType);
                var roomCode = roomCodes[i];
                var otherRoomAllocationOffers = roomCodeOffers.Where((_, index) => index != i);

                // what is special about 0
                if (i == 0)
                {
                    offers = SelectCheapestRoomsInDifferentContracts(offers, otherRoomAllocationOffers);

                    currentContractAccomId ??= offers
                        .FirstOrDefault(offer => offer.GetUnitCode() == roomCode)?
                        .GetAccommodationId();
                }
                else
                {
                    offers = SelectCheapestRoomsInSpecificContract(offers, currentContractAccomId);
                }

                foreach (var offer in offers)
                {
                    var unit = offer.GetUnit();

                    if (unit == null) { continue; }

                    if (!_boardService.HasRequestedBoardType(offer, requestBoardType))
                    {
                        unit.RequireBoardAlteration = unit.Board;
                    }
                    else
                    {
                        unit.RequireBoardAlteration = null;
                    }

                    if (unit.Code == roomCode)
                    {
                        MergeOfferAltBoards(offer, altBoards);
                    }
                }

                IncludeDiffPriceBetweenOfferAndUnit(offers, currentContractAccomId, roomCodeOffers.ElementAt(i));

                if (i == 0 && roomCodes.Length > 1)
                {
                    IncludeContractChangePrice(offers, roomCode, currentContractAccomId, otherRoomAllocationOffers);
                }

                if (roomCodes.Length > 1)
                {
                    IncludeBoardChangePrice(offers, requestBoardType, otherRoomAllocationOffers);
                }

                return CreateSearchResponse(offers);
            })
            .Where(x => x != null)
            .ToArray();

            var marketSettings = _marketService.GetMarket(request.MarketCode);
            var mappedResponses = await MapSearchOffersResponse(responses, marketSettings);
            var altBoards = (GetOfferAlternateBoards(mappedResponses, roomCodes)).ToList();

            var offers = mappedResponses.SelectMany(x => x.Offers.EmptyIfNull()).ToArray();
            await FixPriceForTransfers(offers, request);

            return new RoomVariantsResponse
            {
                SearchOffersResponses = mappedResponses,
                AltBoards = altBoards,
            };
        }

        private static string ResolveMappedRoomCode(string roomCode, AvCacheResultOffersOffer[] offers)
        {
            if (string.IsNullOrEmpty(roomCode) || !OfferHotelMapper.IsExtRoomCode(roomCode))
            {
                return roomCode;
            }

            var offer = offers.FirstOrDefault(offer => offer.GetSourceUnit() == roomCode);

            return offer?.GetUnitCode() ?? roomCode;
        }

        private void IncludeBoardChangePrice(AvCacheResultOffersOffer[] offers,
            string currentBoardType, IEnumerable<AvCacheResultOffersOffer[]> roomCodeOffers)
        {
            foreach (var offer in offers)
            {
                var unit = offer.GetUnit();

                if (unit.RequireBoardAlteration == null)
                    continue;

                var diff = CalculateBoardChangePrice(currentBoardType, unit.RequireBoardAlteration, roomCodeOffers);

                if (diff != 0)
                {
                    offer.GetUnit().AddPrice(diff);
                }
            }
        }

        private static void IncludeContractChangePrice(AvCacheResultOffersOffer[] offers, string roomCode,
            string currentAccomm, IEnumerable<AvCacheResultOffersOffer[]> roomCodeOffers)
        {
            foreach (var offer in offers)
            {
                if (offer.GetUnitCode() != roomCode && offer.GetAccommodationId() != currentAccomm)
                {
                    var accomId = offer.GetAccommodationId();
                    var diff = CalculateContractChangeUnitPrice(currentAccomm, accomId, roomCodeOffers);

                    if (diff == 0)
                    {
                        continue;
                    }

                    var unit = offer.GetUnit();
                    unit.AddPrice(diff);
                }
            }
        }

        /// <summary>
        /// Sometimes two offers have not equal amount of difference between unit price and offer price.
        /// The method calculates this difference and adds this disrepancy amount to the alternative room price.
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="currentAccom"></param>
        /// <param name="roomCodeOffers"></param>
        private static void IncludeDiffPriceBetweenOfferAndUnit(AvCacheResultOffersOffer[] offers, string currentAccom,
            AvCacheResultOffersOffer[] roomCodeOffers)
        {
            var selectedOffer = roomCodeOffers.FirstOrDefault(x => x.GetAccommodationId() == currentAccom);
            var selectedUnitPrice = selectedOffer?.GetUnitPrice();

            if (selectedOffer == null || selectedUnitPrice == null)
            {
                return;
            }

            var selectedDiff = selectedOffer.Price - selectedUnitPrice.Value;

            foreach (var offer in offers)
            {
                var unit = offer.GetUnit();

                if (unit == null)
                {
                    continue;
                }

                var diff = offer.Price - unit.Price - selectedDiff;

                if (diff != 0)
                {
                    unit.AddPrice(diff);
                }
            }
        }

        private decimal CalculateBoardChangePrice(string currentBoard, string targetBoard,
            IEnumerable<AvCacheResultOffersOffer[]> roomCodeOffers)
        {
            var result = 0m;

            foreach (var offers in roomCodeOffers)
            {
                var current = offers.Select(offer => _boardService.GetBoardPrice(offer, currentBoard))
                    .FirstOrDefault(price => price != null);

                var target = offers.Select(offer => _boardService.GetBoardPrice(offer, targetBoard))
                    .FirstOrDefault(price => price != null);

                if (current != null && target != null)
                {
                    result += target.Value - current.Value;
                }
            }

            return result;
        }

        private static decimal CalculateContractChangeUnitPrice(string currentAccomm, string targetAccomm,
            IEnumerable<AvCacheResultOffersOffer[]> roomCodeOffers)
        {
            var result = 0m;

            foreach (var offers in roomCodeOffers)
            {
                var current = offers.FirstOrDefault(x => x.GetAccommodationId() == currentAccomm)?.Price;
                var target = offers.FirstOrDefault(x => x.GetAccommodationId() == targetAccomm)?.Price;

                if (current != null && target != null)
                {
                    result += target.Value - current.Value;
                }
            }

            return result;
        }

        private AltBoardType[] GetOfferAlternateBoards(IEnumerable<SearchOffersResponse> responses, string[] roomCodes)
        {
            var filteredResponses = responses
                .Select((resp, i) =>
                {
                    var roomCode = roomCodes.ElementAtOrDefault(i);

                    return new SearchOffersResponse
                    {
                        Offers = resp.Offers.Where(offer => offer.FirstUnit().Code == roomCode).ToList(),
                    };
                })
                .ToList();

            if (filteredResponses.Count == 0) return Array.Empty<AltBoardType>();

            var altBoards = CreateBoardCodeToRoomMapping(filteredResponses);

            SearchAvailablePackagesAggregator.IntersectAltboards(filteredResponses);

            var result = filteredResponses.First().Offers.SelectMany(x => x.AltBoards).ToArray();

            UpdateOffersAltBoardsUnitCodes(result, altBoards);

            if (filteredResponses.Count > 1)
            {
                foreach (var board in filteredResponses.Skip(1).SelectMany(x => x.Offers.SelectMany(o => o.AltBoards)))
                {
                    var resultBoard = _boardService.GetAlternateBoardByBoardCode(result, board.Code);

                    resultBoard.AddPrice(board);
                }
            }

            return _boardService.DistinctAlternateBoards(result);
        }

        /// <summary>
        /// This function projects offer response and creates a dictionary
        /// where key is board code and value is dictionary,
        /// where key is room code and value is board code
        /// </summary>
        /// <param name="offersResponses"></param>
        /// <returns>
        /// { "AI", {"TW01", "AI"} }
        /// { "AI", {"TW01", null } }
        /// </returns>
        private static Dictionary<string, Dictionary<string, string>> CreateBoardCodeToRoomMapping(
            IEnumerable<SearchOffersResponse> offersResponses)
        {
            var altBoards = new Dictionary<string, Dictionary<string, string>>();

            foreach (var response in offersResponses)
            {
                var offer = response.Offers.FirstOrDefault();
                var roomCode = offer?.FirstUnit()?.Code;

                if (offer == null || roomCode == null)
                {
                    continue;
                }

                offer?.AltBoards?.ForEach(x =>
                {
                    if (altBoards.TryGetValue(x.Code, out var rooms))
                    {
                        rooms[roomCode] = x.UnitCode == roomCode ? null : x.UnitCode;
                    }
                    else
                    {
                        rooms = new Dictionary<string, string>();
                        rooms[roomCode] = x.UnitCode == roomCode ? null : x.UnitCode;
                    }
                    altBoards[x.Code] = rooms;
                });
            }

            return altBoards;
        }

        private static void UpdateOffersAltBoardsUnitCodes(IEnumerable<AltBoardType> boards,
            Dictionary<string, Dictionary<string, string>> boardsMapping)
        {
            foreach (var board in boards)
            {
                // Update alternative unit codes
                board.UnitCodes = boardsMapping[board.Code];
                board.RoomAlterations = boardsMapping[board.Code]
                    .ToDictionary(
                        keyValue => keyValue.Key,
                        keyValue =>
                        {
                            var (roomCode, boardUnitCode) = keyValue;
                            var requireRoomAlteration = !string.IsNullOrEmpty(boardUnitCode) &&
                                OfferHotelMapper.ParseRoomCode(boardUnitCode) !=
                                OfferHotelMapper.ParseRoomCode(roomCode);

                            return requireRoomAlteration ? boardUnitCode : default;
                        });
            }
        }

        /// <summary>
        /// Do Atcom search type4 request to get list of alternative flights on pre-booking flow
        /// </summary>
        /// <param name="request">Request model</param>
        /// <returns>Collection of accommodation offers, which enrich with details from CMS</returns>
        public async Task<SearchOffersResponse> AlternativeFlights(AlternativeFlightsSearchRequest request)
        {
            var response = await _searchOffersService.DoSearch(
                request,
                _searchRequestsMapper.MapAlternativeFlights(request, _atcomSettings.EndpointTemplate.SearchAlternativeFlights),
                true
            );

            var marketSettings = _marketService.GetMarket(request.MarketCode);

            var searchOffers = await _offersMapper.Map(response, marketSettings);

            await _airportsMapper.EnrichAirportDistance(searchOffers, request);

            return searchOffers;
        }

        /// <summary>
        /// Do Atcom search type4 request to get list of alternative flights on post-booking flow
        /// </summary>
        /// <param name="request">Request model</param>
        /// <param name="packageThemeType">Package theme.</param>
        /// <returns>Collection of accommodation offers</returns>
        public async Task<SearchOffersResponse> AlternativeFlights(AmendFlightSearchRequest request, PackageThemeType packageThemeType)
        {
            var response = await _searchOffersService.DoSearch(
                request,
                _searchRequestsMapper.MapAlternativeFlights(request, _atcomSettings.EndpointTemplate.SearchAlternativeFlights, packageThemeType),
                true
            );

            var marketSettings = _marketService.GetMarket(request.MarketCode);
            var searchOffers = await _offersMapper.Map(response, marketSettings);

            //filter flights by outbound departure time and inbound departure time
            searchOffers.Offers = FilterFlights(searchOffers.Offers, request.OutboundDepartureTime, request.InboundDepartureTime)?.ToList();

            await _airportsMapper.EnrichAirportDistance(searchOffers, request);

            return searchOffers;
        }


        /// <inheritdoc />
        public async Task<PriceGraphResponse> PriceGraph(PriceGraphRequest request)
        {
            int offset = _searchSettings.PriceGraphRange;
            DateTimeOffset initialDate = DateFormatUtils.Parse(request.StartDate);
            DateTimeOffset startDate = initialDate.AddDays(-offset);
            DateTimeOffset endDate = initialDate.AddDays(offset);

            if (Math.Abs((initialDate - DateFormatUtils.Parse(request.InitialDate)).Days) >= _searchSettings.MaximumPriceGraphDate)
            {
                throw new ApiException(ApiExceptionCodes.SearchAlternativeOffersError, $"Search date must be less than {DateFormatUtils.Parse(request.InitialDate).AddDays(_searchSettings.MaximumPriceGraphDate).ToString()}", null, null, HttpStatusCode.BadRequest);
            }

            // Dates range to return
            var datesRange = Enumerable.Range(0, offset * 2 + 1).Select(d => startDate.AddDays(d));
            return await BuildPriceGraphDates(request, DateFormatUtils.DateOnly(startDate), DateFormatUtils.DateOnly(endDate), datesRange);
        }


        /// <inheritdoc />
        public async Task<PriceGraphResponse> PriceGraph(PriceGraphMonthRequest request)
        {
            DateTimeOffset startDate = DateFormatUtils.Parse(request.Start);
            DateTimeOffset endDate = DateFormatUtils.Parse(request.End);
            // Dates range to return
            var datesRange = Enumerable.Range(0, endDate.Subtract(startDate).Days + 1).Select(d => startDate.AddDays(d));

            if (datesRange.Count() > _searchSettings.MaximumPriceGraphDaysToReturn)
            {
                throw new ApiException(ApiExceptionCodes.SearchAlternativeOffersError, $"Maximum dates range reached", null, null, HttpStatusCode.BadRequest);
            }

            return await BuildPriceGraphDates(request, request.Start, request.End, datesRange);
        }

        /// <inheritdoc />
        public async Task<SearchOffersResponse> AlternativeHotels(
            AlternativeHotelsSearchRequest alternativeHotelsSearchRequest, PackagesSearchRequest packagesSearchRequest)
        {
            ArgumentNullException.ThrowIfNull(alternativeHotelsSearchRequest);

            var requestParams = alternativeHotelsSearchRequest.BuildAtcomQueryParams(_atcomSettings.EndpointTemplate.SearchAlternativeHotels);

            var response = await GetAmendHotelsOffer<SearchAlternativeHotelsRequest>(requestParams, alternativeHotelsSearchRequest.MarketCode);
            var offers = response.Payload.Body.Result.Offers.Offer;

            if (offers.IsNullOrEmpty())
                return new SearchOffersResponse();

            var filteredOffers = await _searchAvailablePackagesFilterAndMapper.TransformOriginalOffers(
                    offers.ToList(), packagesSearchRequest, ignoreFilters: false, ignoreFilterOptions: false, sortAndPaginate: true);

            return filteredOffers.SearchOffersResponse;
        }

        /// <inheritdoc />
        public async Task<SearchOffersResponse> AlternativeHotelRooms(AlternativeHotelRoomsSearchRequest alternativeHotelRoomsSearchRequest)
        {
            ArgumentNullException.ThrowIfNull(alternativeHotelRoomsSearchRequest);

            var requestParams = alternativeHotelRoomsSearchRequest.BuildAtcomQueryParams(_atcomSettings.EndpointTemplate.SearchAlternativeHotelRooms);
            var marketSettings = _marketService.GetMarket(alternativeHotelRoomsSearchRequest.MarketCode);
            var searchOffers = await GetAmendHotelsOffer<SearchAlternativeHotelRoomsRequest>(requestParams, marketSettings.Code);
            var offers = await _offersMapper.Map(searchOffers, marketSettings);
            return offers;
        }

        private async Task<SearchAvailablePackagesResponse> GetAmendHotelsOffer<T>(string requestParams, string marketCode)
            where T : AtcomApiRequest<object>
        {
            var searchRequest = Activator.CreateInstance<T>();
            searchRequest.AddQueryString(requestParams);
            var response = await _searchOffersService.DoSearch(searchRequest, marketCode);
            return response;
        }

        private static AvCacheResultOffersOffer[][] FilterOffersByRoomCode(RoomAllocationOffers[] roomAllocationOffers,
            IEnumerable<string> roomCodes)
        {
            return roomCodes
                .Select((roomCode, i) =>
                    {
                        if (string.IsNullOrEmpty(roomCode) || roomAllocationOffers.Length <= i)
                        {
                            return Array.Empty<AvCacheResultOffersOffer>();
                        }

                        return roomAllocationOffers[i].Offers.ByUnitCode(roomCode)
                            .Select(x => x.DeepClone()).ToArray();
                    })
                .ToArray();
        }


        private async Task<RoomAllocationOffers[]> GetRoomAllocationOffers(RoomVariantsSearchRequest request)
        {
            var roomOffers = new List<RoomAllocationOffers>();
            var childAges = request.ChildAges != null
                ? request.ChildAges.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                : Array.Empty<string>();
            var childAgesSkip = 0;

            foreach (var roomAllocation in request.Room)
            {
                var roomAllocationChildAges = string.Join(",",
                    childAges.Skip(childAgesSkip).Take(roomAllocation.Children));
                childAgesSkip += roomAllocation.Children;

                var roomCode = roomAllocation.RoomCode;
                // Atcom do not filter by mapped external room code
                var unfilterableRoomCode = !string.IsNullOrEmpty(roomCode) &&
                    request.IsExt && !OfferHotelMapper.IsExtRoomCode(roomCode);

                if (unfilterableRoomCode)
                {
                    roomAllocation.RoomCode = null;
                }

                var offers = await SearchRoomVariantOffers(request, roomAllocation, roomAllocationChildAges);

                if (unfilterableRoomCode)
                {
                    offers = offers.ByUnitCode(roomCode).ToArray();
                    roomAllocation.RoomCode = roomCode;
                }

                offers = MergeExternalRoomVariantOffers(offers);

                roomOffers.Add(new(roomAllocation, offers));
            }

            return roomOffers.ToArray();
        }

        private static AvCacheResultOffersOffer[] MergeExternalRoomVariantOffers(AvCacheResultOffersOffer[] offers)
        {
            if (!offers.Any(offer => offer.GetUnitCode() != null && OfferHotelMapper.IsExtRoomCode(offer.GetUnitCode())))
            {
                return offers;
            }

            var result = new List<AvCacheResultOffersOffer>(capacity: offers.Length);
            var dict = new Dictionary<string, AvCacheResultOffersOffer>(capacity: offers.Length);

            foreach (var offer in offers)
            {
                var unitcode = offer.GetUnitCode();

                if (!OfferHotelMapper.IsExtRoomCode(unitcode))
                {
                    result.Add(offer);
                    continue;
                }

                var baseRoomCode = OfferHotelMapper.ParseRoomCode(unitcode);

                if (dict.TryGetValue(baseRoomCode, out var baseOffer) && baseOffer != null)
                {
                    if (baseOffer.GetSelectedBoardCode() == offer.GetSelectedBoardCode())
                    {
                        if (offer.Price < baseOffer.Price)
                        {
                            dict[baseRoomCode] = offer;
                        }

                        continue;
                    }

                    AddOfferAsAlternativeBoard(baseOffer, offer);
                }
                else
                {
                    dict.Add(baseRoomCode, offer);
                }
            }

            result.AddRange(dict.Values);

            return result.ToArray();
        }

        private static void AddOfferAsAlternativeBoard(AvCacheResultOffersOffer baseOffer, AvCacheResultOffersOffer offer)
        {
            static void UpdateBoard(AvCacheResultOffersOfferBoard board, AvCacheResultOffersOffer offer)
            {
                board.AccommodationId = offer.GetAccommodationId();
                board.PackageId = offer.GetPackageId();
                board.IsExternal = offer.IsExternal();
                board.System = offer.GetSystem();
                board.Code = offer.GetSelectedBoardCode();
                board.UnitCode = offer.GetUnitCode();
                board.Price = offer.Price;
            }

            var code = offer.GetSelectedBoardCode();
            var price = offer.Price;

            var existingBoard = baseOffer.AltBoard?.FirstOrDefault(x => x.Code == code);

            if (existingBoard != null && existingBoard.Price <= price)
            {
                return;
            }

            if (existingBoard != null)
            {
                UpdateBoard(existingBoard, offer);
                return;
            }

            var altBoard = new AvCacheResultOffersOfferBoard();
            UpdateBoard(altBoard, offer);

            var length = baseOffer.AltBoard?.Length ?? 0;
            Array.Resize(ref baseOffer.AltBoard, length + 1);
            baseOffer.AltBoard[length] = altBoard;
        }

        private async Task<AvCacheResultOffersOffer[]> SearchRoomVariantOffers(RoomVariantsSearchRequest sourceRequest,
            RoomAllocation roomAllocation, string childAges)
        {
            Task<SearchAvailablePackagesResponse> DoSearch(AlternativeAccomodation alt = null)
            {
                var request = sourceRequest.DeepClone();
                request.ChildAges = childAges;

                if (alt != null)
                {
                    request.AccommodationId = alt.AccomodationId;
                    request.PackageId = alt.PackageId;
                }

                var searchRequest = MapRoomVariantsRequest(roomAllocation, request);

                return _searchOffersService.DoSearch(request, searchRequest, false);
            }

            var searches = sourceRequest.AlternativeAccomodations.EmptyIfNull()
                .Select(alt => DoSearch(alt))
                .Prepend(DoSearch());

            var results = await Task.WhenAll(searches);
            var offers = results.SelectMany(result =>
                    result.Payload?.Body?.Result?.Offers?.Offer ?? Enumerable.Empty<AvCacheResultOffersOffer>())
                .Where(offer => offer.GetUnitPrice() != null) //Add offers only with price
                .ToArray();

            return offers;
        }

        private async Task<List<SearchOffersResponse>> MapSearchOffersResponse(IEnumerable<SearchAvailablePackagesResponse> responses, MarketSettings marketSettings)
        {
            // convert response
            var tasks = responses.Select(async response => await _offersMapper.Map(response, marketSettings)).ToList();
            var results = await Task.WhenAll(tasks);
            return results.ToList();
        }

        private static SearchAvailablePackagesResponse CreateSearchResponse(AvCacheResultOffersOffer[] offers)
        {
            return new SearchAvailablePackagesResponse
            {
                Payload = new()
                {
                    Body = new()
                    {
                        Status = new() { Total = new() { Count = (uint)offers.Length } },
                        Result = new() { Offers = new() { Offer = offers } },
                    }
                }
            };
        }

        private void MergeOfferAltBoards(AvCacheResultOffersOffer offer,
            IEnumerable<AvCacheResultOffersOfferBoard> allBoards)
        {
            var dict = new Dictionary<string, AvCacheResultOffersOfferBoard>(StringComparer.OrdinalIgnoreCase);

            foreach (var offerBoard in offer.AltBoard.EmptyIfNull())
            {
                dict.TryAdd(offerBoard.Code, offerBoard);
            }

            foreach (var board in allBoards.EmptyIfNull())
            {
                if (!dict.TryAdd(board.Code, board))
                {
                    var currentBoard = dict[board.Code];

                    if (currentBoard.UnitCode != board.UnitCode)
                    {
                        continue;
                    }

                    // Compare alternative board from another system
                    if (board.Price < currentBoard.Price ||
                        board.Price == currentBoard.Price &&
                        GetSystemPriority(board.System) < GetSystemPriority(currentBoard.System))
                    {
                        dict[board.Code] = board;
                    }
                }
            }

            offer.AltBoard = dict.Values.ToArray();
        }

        private int GetSystemPriority(string system)
        {
            // 0 - highest priority
            if (string.IsNullOrEmpty(system)) return int.MaxValue;

            return _atcomSettings.RoomSystemsSettings.Priorities.TryGetValue(system, out var priority)
                ? priority
                : int.MaxValue;
        }

        private static AvCacheResultOffersOffer[] SelectCheapestRoomsInSpecificContract(
            IEnumerable<AvCacheResultOffersOffer> roomAllocationOffers, string accommId)
        {
            var list = new List<AvCacheResultOffersOffer>();

            foreach (var group in roomAllocationOffers.Where(x => x.GetAccommodationId() == accommId).GroupByUnitCode())
            {
                var currentCheapest = default(AvCacheResultOffersOffer);

                foreach (var offer in group)
                {
                    if (currentCheapest == null)
                    {
                        currentCheapest = offer;
                        continue;
                    }

                    // Price is less
                    if (offer.GetUnitPrice() < currentCheapest.GetUnitPrice())
                    {
                        currentCheapest = offer;
                    }
                }

                list.Add(currentCheapest);
            }

            return list.ToArray();
        }

        private AvCacheResultOffersOffer[] SelectCheapestRoomsInDifferentContracts(
            IEnumerable<AvCacheResultOffersOffer> roomAllocationOffers,
            IEnumerable<AvCacheResultOffersOffer[]> otherRoomAllocationOffers)
        {
            var list = new List<AvCacheResultOffersOffer>();
            var filterSystems = GetSystemsFoundForAllRoomAllocations(otherRoomAllocationOffers);

            if (filterSystems.Any())
            {
                roomAllocationOffers = roomAllocationOffers.Where(offer => filterSystems.Contains(offer.GetSystem()));
            }

            foreach (var group in roomAllocationOffers.GroupByUnitCode())
            {
                var currentCheapest = default(AvCacheResultOffersOffer);
                var currentCheapestPrice = 0m;
                var currentCheapestSystem = default(string);

                foreach (var offer in group)
                {
                    if (currentCheapest == null)
                    {
                        currentCheapest = offer;
                        currentCheapestPrice = CalculateOfferPrice(offer, otherRoomAllocationOffers);
                        currentCheapestSystem = offer.GetSystem();
                        continue;
                    }

                    var system = offer.GetSystem();

                    if (system == _atcomSettings.RoomSystemsSettings.SystemToDiscard)
                    {
                        // Ignore discarded system offer
                        if (currentCheapestSystem != _atcomSettings.RoomSystemsSettings.SystemToDiscard)
                            continue;
                    }
                    // Overwrite discarded system offer without price comsparision
                    else if (currentCheapestSystem == _atcomSettings.RoomSystemsSettings.SystemToDiscard)
                    {
                        currentCheapest = offer;
                        currentCheapestPrice = CalculateOfferPrice(offer, otherRoomAllocationOffers);
                        currentCheapestSystem = system;
                        continue;
                    }

                    var offerPrice = CalculateOfferPrice(offer, otherRoomAllocationOffers);

                    // Price is higher or system less prior
                    if (offerPrice > currentCheapestPrice ||
                        offerPrice == currentCheapestPrice &&
                        GetSystemPriority(system) > GetSystemPriority(currentCheapestSystem))
                    {
                        continue;
                    }

                    currentCheapest = offer;
                    currentCheapestPrice = offerPrice;
                    currentCheapestSystem = system;
                }

                list.Add(currentCheapest);
            }

            return list.ToArray();
        }

        private static HashSet<string> GetSystemsFoundForAllRoomAllocations(
            IEnumerable<AvCacheResultOffersOffer[]> otherRoomAllocationOffers)
        {
            var systems = new HashSet<string>();

            foreach (var offers in otherRoomAllocationOffers)
            {
                if (systems.Count == 0)
                {
                    foreach (var sys in offers.Select(x => x.GetSystem()))
                    {
                        systems.Add(sys);
                    }

                    continue;
                }

                var systemToRemove = systems.Where(sys => offers.Select(x => x.GetSystem()).All(x => x != sys));

                foreach (var sys in systemToRemove)
                {
                    systems.Remove(sys);
                }
            }

            return systems;
        }

        private static decimal CalculateOfferPrice(AvCacheResultOffersOffer offer,
            IEnumerable<AvCacheResultOffersOffer[]> otherRoomAllocationOffers)
        {
            var system = offer.GetSystem();
            var price = offer.GetUnitPrice() ?? throw new NullReferenceException("Price expected to be not null");

            return price + otherRoomAllocationOffers.SelectMany(x => x)
                .Where(x => x.GetSystem() == system)
                .Sum(x => x.GetUnitPrice() ?? throw new NullReferenceException("Price expected to be not null"));
        }

        /// <summary>
        /// Method is designed to fix wrong offer prcice because of multiple requests.
        /// The reason is that each response includes transfer price for specific number of people, but in total we may need less transfer items then we have.
        /// That's why we do one more search request to get Transfer quantity and price.
        /// </summary>
        /// <param name="request">Original request</param>
        /// <param name="offer">Offer to update</param>
        /// <returns></returns>
        private async Task FixPriceBecauseOfTransfers(RoomVariantsSearchRequest request, Offer offer)
        {
            // We should apply this fix only if pricing method is per-item, otherwise everything is OK
            var perItemTransfers = offer.Transfers.Where(t => t.Method == ItemMethod.PI).ToList();
            if (!perItemTransfers.Any())
            {
                return;
            }

            // If we have more than one room we have to ask Atcom for transfer details: we need to know max/min pax for transfer item to calculate correct quantity.
            var requestClone = request.DeepClone();
            requestClone.AccommodationId = offer.Accom.Code;
            var searchRequest = _searchRequestsMapper.MapRoomVariants(requestClone, _atcomSettings.EndpointTemplate.Search);

            var response = await _searchOffersService.DoSearch(
               requestClone,
               searchRequest,
               true
            );

            var foundTransfers = response.Payload.Body.Result.Offers?.Offer?.FirstOrDefault()?.Transfers?.Transfer;

            decimal priceDelta = 0;
            perItemTransfers.ForEach(t =>
            {
                var foundT = foundTransfers?.FirstOrDefault(x => x.Code.EndsWith(t.Code));
                if (foundT != null)
                {
                    // Delta is tricky. Because we combined results for each individual room transfer price was included N times.
                    // Thaths' why price is multiplied by rooms quantity
                    // Also we overwrite value in forEach just because offer may have only one transfer, but the data model has array here
                    priceDelta = (t.Price * t.Quantity) - foundT.Price;

                    t.Price = foundT.Price;
                    t.Quantity = (int)foundT.Qty;
                }
            });

            // price = curr_price - (current_transfer - new_trans)
            decimal divider = offer.Price / offer.PricePP;
            offer.Price -= priceDelta;
            offer.PricePP = offer.Price / divider;
        }
        private void TryChangeOfferBoardType(AvCacheResultOffersOffer offer, string boardType)
        {
            if (string.IsNullOrEmpty(boardType) || _boardService.BoardCodesAreEqual(offer.GetSelectedBoardCode(), boardType))
            {
                return;
            }

            var unit = offer.GetUnit();

            var alternateOfferBoard = _boardService.FirstOrDefaultAlternateBoard(offer.AltBoard.EmptyIfNull(), boardType);

            if (alternateOfferBoard == null || unit == null)
            {
                return;
            }

            var priceOfferDiff = offer.Price - unit.Price;

            // alternate board price
            var alternateOfferPrice = alternateOfferBoard.Price;

            var numP = offer.Price / offer.PricePP;

            alternateOfferBoard.Price = offer.Price;

            // update default unit board with altOffer board
            alternateOfferBoard.Code = unit.Board;

            // altBoard price is price of offer
            offer.Price = alternateOfferPrice;
            //update pricePP with alternate board pricePP
            offer.PricePP = alternateOfferPrice / numP;

            // difference of the offer and unit price .....
            unit.Price = alternateOfferPrice - priceOfferDiff;
            unit.PricePP = (alternateOfferPrice - priceOfferDiff) / numP;
            unit.Board = boardType;

            if (alternateOfferBoard.UnitCode is not null && OfferHotelMapper.IsExtRoomCode(unit.Code))
            {
                var boardUnitCode = alternateOfferBoard.UnitCode;
                alternateOfferBoard.UnitCode = unit.Code;
                unit.Code = boardUnitCode;

                if (unit.SrcInfo != null)
                {
                    unit.SrcInfo.Unit = boardUnitCode;
                    unit.SrcInfo.Board = boardType;
                }
            }
        }

        /// <summary>
        /// Map Search request for Room variants
        /// </summary>
        /// <param name="roomAllocation">Room allocation options</param>
        /// <param name="request">search request</param>
        /// <returns></returns>
        private SearchAvailablePackagesRequest MapRoomVariantsRequest(RoomAllocation roomAllocation,
            RoomVariantsSearchRequest request)
        {
            var roomAllocationList = new List<RoomAllocation> { roomAllocation };

            // Set single room for request - Atcom doesn't suport multiple rooms for this request type
            request.Room = roomAllocationList;

            var mappedRequest = _searchRequestsMapper.MapRoomVariants(request,
                _atcomSettings.EndpointTemplate.SearchRoomVariants);

            // do request always for 1 room, that's why we start guest ids from "1"
            var paxAllocationQuery = SearchQueryUtils.BuildRoomAllocationQuery(roomAllocationList, request.BoardType);

            mappedRequest.AddQueryString(paxAllocationQuery);

            return mappedRequest;
        }

        private async Task<PriceGraphResponse> BuildPriceGraphDates(PriceGraphBaseRequest request, string startDate, string endDate, IEnumerable<DateTimeOffset> datesRange)
        {
            IEnumerable<IGrouping<DateTime?, Offer>>[] allResponses;

            var selectedContract = request.AccommodationIds.Split(',')[0];

            if (request.IsCheapestRoom.HasValue && request.IsCheapestRoom.Value)
            {
                var alternateBoardRoomContractRequest = request.DeepClone();
                alternateBoardRoomContractRequest.Room.ForEach(r => r.RoomCode = string.Empty);
                alternateBoardRoomContractRequest.BoardType = null;
                alternateBoardRoomContractRequest.AccommodationIds = request.AccommodationIds;
                var alternateBoardRoomContractTask = DoSearch(alternateBoardRoomContractRequest, startDate, endDate);

                var alternateBoardRoomContractOffers = await alternateBoardRoomContractTask;

                allResponses = [alternateBoardRoomContractOffers];
            }
            else
            {
                // perform each search
                var matchRequestRequest = request.DeepClone();
                matchRequestRequest.AccommodationIds = selectedContract;
                var matchRequestTask = DoSearch(matchRequestRequest, startDate, endDate);

                var alternateBoardRequest = request.DeepClone();
                alternateBoardRequest.BoardType = null;
                alternateBoardRequest.AccommodationIds = selectedContract;
                var alternateBoardTask = DoSearch(alternateBoardRequest, startDate, endDate);

                var alternateRoomRequest = request.DeepClone();
                alternateRoomRequest.Room.ForEach(r => r.RoomCode = string.Empty);
                alternateRoomRequest.AccommodationIds = selectedContract;
                var alternateRoomTask = DoSearch(alternateRoomRequest, startDate, endDate);

                var alternateBoardRoomContractRequest = request.DeepClone();
                alternateBoardRoomContractRequest.Room.ForEach(r => r.RoomCode = string.Empty);
                alternateBoardRoomContractRequest.BoardType = null;
                alternateBoardRoomContractRequest.AccommodationIds = request.AccommodationIds;
                var alternateBoardRoomContractTask = DoSearch(alternateBoardRoomContractRequest, startDate, endDate);

                var alternateBoardRoomContractOffers = await alternateBoardRoomContractTask;
                var matchRequestOffers = await matchRequestTask;
                var alternateBoardOffers = await alternateBoardTask;
                var alternateRoomOffers = await alternateRoomTask;

                // order of elements in this array is important.  Offer for date should should be selected exactMatch, alternateBoard, alternateRoom, alternate room and board
                allResponses = [matchRequestOffers, alternateBoardOffers, alternateRoomOffers, alternateBoardRoomContractOffers];
            }

            Hotel hotelModel = await GetHotelModel(allResponses);

            if (hotelModel is null)
            {
                return new PriceGraphResponse { Offers = datesRange.Select(dr => new AlternativeOffer { Date = dr.Date }).ToList() };
            }

            var offers = datesRange.Select(async drDate =>
            {
                Offer offer = null;

                foreach (var aResponse in allResponses)
                {
                    offer = SelectOffer(aResponse, drDate, request.BoardType);

                    if (offer is not null)
                        break;
                }

                if (offer is null)
                {
                    return new AlternativeOffer { Date = drDate.Date };
                }

                offer.Hotel = new OfferHotel { StarRating = hotelModel.StarRating.ToString(CultureInfo.InvariantCulture) };

                var tasks = offer.Accom.Unit
                    .Select(async u => await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotelModel, u, offer.Date, offer.Stay));

                await Task.WhenAll(tasks.ToArray());

                return new AlternativeOffer
                {
                    Date = drDate.Date,
                    Price = offer.Price,
                    PricePP = offer.PricePP,
                    TouristTax = offer.TouristTax,
                    Board = offer.FirstUnit().Board,
                    BoardType = offer.FirstUnit().BoardType,
                    OutboundRouteId = offer.Transport.Routes.First(r => r.Direction == Direction.Outbound).Id,
                    InboundRouteId = offer.Transport.Routes.First(r => r.Direction == Direction.Inbound).Id,
                    AccommodationId = offer.Accom.Id,
                    Rooms = offer.Accom.Unit.Select(u =>
                    {
                        return new AlternateRoom { RoomCode = u.Code, IsFreeForKids = u.FreeForKids, RoomType = u.RoomType };
                    }).ToList()
                };
            }).Select(t => t.Result).ToList();

            return new PriceGraphResponse
            {
                Offers = [.. offers.OrderBy(o => o.Date)]
            };
        }

        private async Task<Hotel> GetHotelModel(IEnumerable<IGrouping<DateTime?, Offer>>[] allResponses)
        {
            Hotel hotelModel = null;

            var response = allResponses.FirstOrDefault(r => r is not null && r.Any());

            if (response != null)
            {
                var accommCode = response.First().First().Accom.Code;
                hotelModel = (await _hotelsService.Search([accommCode])).First();
            }

            return hotelModel;
        }

        static Offer SelectOffer(IEnumerable<IGrouping<DateTime?, Offer>> groupingOffersByDate, DateTimeOffset dateTimeOffset, string boardType)
        {
            if (groupingOffersByDate is not null)
            {
                var groupedOffers = groupingOffersByDate.FirstOrDefault(x => x.Key.HasValue && x.Key.Value == dateTimeOffset.Date);
                if (groupedOffers != null)
                    return groupedOffers.FirstOrDefault(gf => gf.Accom.Unit.All(u => u.Board == boardType)) ?? groupedOffers.First();
            }
            return null;
        }

        async Task<IEnumerable<IGrouping<DateTime?, Offer>>> DoSearch(PriceGraphBaseRequest priceGraphBaseRequest, string startDate, string endDate)
        {
            var marketSettings = _marketService.GetMarket(priceGraphBaseRequest.MarketCode);
            SearchOffersResponse searchOffersResponse = new();
            searchOffersResponse.Offers = new();

            var allResponses = priceGraphBaseRequest.AccommodationIds.Split(',').Select(async id =>
            {
                priceGraphBaseRequest.AccommodationIds = id;

                var request = _searchRequestsMapper.MapPriceGraph(priceGraphBaseRequest, startDate, endDate, _atcomSettings.EndpointTemplate.PriceGraph);

                var searchResults = await _searchOffersService.DoSearch(priceGraphBaseRequest, request, true);

                return searchResults;
            }).Select(r => r.Result);

            foreach (var aResponse in allResponses)
            {
                if (aResponse.Payload.Body.Result.Offers.Count > 0)
                {
                    var mappedResults = await _offersMapper.Map(aResponse, marketSettings);
                    searchOffersResponse.Offers.AddRange(mappedResults.Offers);
                }
            }

            if (searchOffersResponse.Offers.Count == 0)
            {
                return Enumerable.Empty<IGrouping<DateTime?, Offer>>();
            }
            
            return searchOffersResponse.Offers.OrderBy(x => x.Price).GroupBy(p => p.Date);
        }

        /// <summary>
        /// Filter flights by outbound departure time and inbound departure time
        /// </summary>
        /// <param name="offers"></param>
        /// <param name="outboundDepartureTime"></param>
        /// <param name="inboundDepartureTime"></param>
        /// <returns></returns>
        private static IEnumerable<Offer> FilterFlights(IEnumerable<Offer> offers, IEnumerable<TimePeriod> outboundDepartureTime,
            IEnumerable<TimePeriod> inboundDepartureTime)
        {
            if (offers.IsNullOrEmpty())
            {
                return offers;
            }

            if (outboundDepartureTime.IsNullOrEmpty() && inboundDepartureTime.IsNullOrEmpty())
            {
                return offers;
            }

            var filteredOffers = offers.Where(offer =>
            {
                var outBoundDepTime = offer?.Transport?.Routes[0]?.DepDate.Value.TimeOfDay;
                var inboundDepTime = offer?.Transport?.Routes[1]?.DepDate.Value.TimeOfDay;

                var isOutBoundDepTimeMatch = outboundDepartureTime?.Any(period =>
                {
                    var startOutBoundDepartureTime = DateTime.ParseExact(period.Start, TimePeriod.TimePeriodFormat, null).TimeOfDay;
                    var endOutBoundDepartureTime = DateTime.ParseExact(period.End, TimePeriod.TimePeriodFormat, null).TimeOfDay;

                    //Handle case if time range between 2 days (e.g. [18.00-6:00])
                    if (startOutBoundDepartureTime > endOutBoundDepartureTime)
                    {
                        endOutBoundDepartureTime = endOutBoundDepartureTime.Add(TimeSpan.FromDays(1));
                    }

                    return startOutBoundDepartureTime <= outBoundDepTime && outBoundDepTime <= endOutBoundDepartureTime;
                }) ?? true;

                var isInboundBoundDepTimeMatch = inboundDepartureTime?.Any(period =>
                {
                    var startInboundBoundDepTime = DateTime.ParseExact(period.Start, TimePeriod.TimePeriodFormat, null).TimeOfDay;
                    var endInboundBoundDepTime = DateTime.ParseExact(period.End, TimePeriod.TimePeriodFormat, null).TimeOfDay;

                    //Handle case if time range between 2 days (e.g. [18.00-6:00])
                    if (startInboundBoundDepTime > endInboundBoundDepTime)
                    {
                        endInboundBoundDepTime = endInboundBoundDepTime.Add(TimeSpan.FromDays(1));
                    }

                    return startInboundBoundDepTime <= inboundDepTime && inboundDepTime <= endInboundBoundDepTime;
                }) ?? true;

                return isOutBoundDepTimeMatch && isInboundBoundDepTimeMatch;

            });

            return filteredOffers;
        }

        private sealed record RoomAllocationOffers(RoomAllocation RoomAllocation, AvCacheResultOffersOffer[] Offers);
    }
}