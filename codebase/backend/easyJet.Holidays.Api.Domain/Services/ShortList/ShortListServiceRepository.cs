using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.ShortList;
using easyJet.Holidays.Api.Domain.Data.ShortList;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.ShortList;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Globalization;

namespace easyJet.Holidays.Api.Domain.Services.ShortList
{
    public class ShortListServiceRepository : IShortListServiceRepository
    {

        private readonly IHotelsService _hotelsService;
        private readonly ILogger<ShortListServiceRepository> _logger;
        private readonly IAccommodationOfferService _accommodationOfferService;
        private readonly IShortListService _shortListService;
        private readonly IAuthenticationService _authenticationService;
        private readonly IMarketService _marketService;
        private readonly ILanguageService _languageService;
        private readonly AtcomSettings _atcomSettings;
        private readonly IHotelThemeService _hotelThemeService;
        private readonly IOfferHotelMapper _offerHotelMapper;
        private readonly IAirportsMapper _airportsMapper;
        private readonly IReferenceDataService _referenceDataService;

        public ShortListServiceRepository(
            IHotelsService hotelsService,
            ILogger<ShortListServiceRepository> logger,
            IAccommodationOfferService accommodationOfferService,
            IShortListService shortListService,
            IAuthenticationService authenticationService,
            IMarketService marketService,
            ILanguageService languageService,
            IOptions<AtcomSettings> atcomSettings,
            IHotelThemeService hotelThemeService,
            IOfferHotelMapper offerHotelMapper,
            IAirportsMapper airportsMapper,
            IReferenceDataService referenceDataService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _hotelsService = hotelsService;
            _logger = logger;
            _accommodationOfferService = accommodationOfferService;
            _shortListService = shortListService;
            _authenticationService = authenticationService;
            _marketService = marketService;
            _languageService = languageService;
            _hotelThemeService = hotelThemeService;
            _offerHotelMapper = offerHotelMapper;
            _airportsMapper = airportsMapper;
            _referenceDataService = referenceDataService;
        }

        /// <inheritdoc />
        public async Task<ShortListOffersResponse> Get(int page = 1, int take = 10)
        {
            var customerShortlist = await GetCustomerShortlist();
            return await SearchShortListOffers(customerShortlist, page, take);
        }

        /// <inheritdoc/>
        public async Task<ShortListOffersResponse> Summary(ShortListType? shortListType, bool omitUnavailable)
        {
            var customerShortlist = await GetCustomerShortlist();

            if (shortListType.HasValue)
            {
                customerShortlist = customerShortlist.Where(x => x.ShortListType == shortListType);
            }

            return await SearchShortListSummary(customerShortlist, omitUnavailable);
        }

        /// <inheritdoc />
        public async Task<ShortListStatus> CreateOrUpdate(ShortListOfferRequest request)
        {
            var customId = await _authenticationService.GetCustomerIdWithErrorsHandling();
            request.Id = Guid.NewGuid().ToString();
            request.CreatedAt = DateTime.UtcNow.ToString("o");
            request.MarketCode = _marketService.GetCurrentMarket().Code;
            request.Language = _languageService.GetCurrentLanguage();
            var status = await _shortListService.CreateOrUpdateUserShortList(customId, request) ?? new ShortListStatus();
            status.SavedOffersCount = await GetFilteredSavedOffersCount(customId);

            return status;
        }

        /// <inheritdoc />
        public async Task<ShortListStatus> Delete(List<string> ids)
        {
            var customId = await _authenticationService.GetCustomerIdWithErrorsHandling();
            var status = await _shortListService.RemoveOfferFormList(customId, ids) ?? new ShortListStatus();
            status.SavedOffersCount = await GetFilteredSavedOffersCount(customId);

            return status;
        }

        /// <inheritdoc />
        public async Task<ShortListStatus> Status()
        {
            var customId = await _authenticationService.GetCustomerIdWithErrorsHandling();
            return new ShortListStatus()
            {
                SavedOffersCount = await GetFilteredSavedOffersCount(customId)
            };
        }

        /// <inheritdoc />
        public async Task<ShortListStatus> HotelStatus(string giataCode)
        {
            var customId = await _authenticationService.GetCustomerIdWithErrorsHandling();
            var connectedAccomodations = await _hotelsService.GetAccomodationsByGiata([giataCode]);
            connectedAccomodations.TryGetValue(giataCode, out var accomodations);

            var dynamoDbResult = await _shortListService.GetUserShortList(customId);
            var result = dynamoDbResult?.FirstOrDefault(x =>
                (x.GiataCode != null && x.GiataCode.Equals(giataCode, StringComparison.OrdinalIgnoreCase) ||
                (accomodations != null && accomodations.Contains(x.AccommodationId))) &&
                x.ShortListType == ShortListType.Hotel);


            return new ShortListStatus
            {
                SavedOffersCount = result != null ? 1 : 0,
                CreatedID = result?.Id
            };
        }

        /// <inheritdoc />
        public async Task UpdateOffersRefToUserShortList(ICollection<Offer> offers)
        {
            // null checking just in case
            if (offers?.Any() != true)
            {
                return;
            }

            string customerId = await _authenticationService.MappedCustomerId();
            if (string.IsNullOrEmpty(customerId))
            {
                // Does not modify offers if user is not logged in
                return;
            }

            // Get user saved data
            var dynamoDbResult = await _shortListService.GetUserShortList(customerId);

            if (dynamoDbResult?.Any() != true)
            {
                return;
            }

            foreach (var offer in offers)
            {
                // Update ID
                var shortlistDBEntry = dynamoDbResult.FirstOrDefault(y => OfferUtils.CompareAccomadationRequestAndOfferInfo(y, offer));
                if (shortlistDBEntry != null)
                {
                    offer.Shortlist = new ShortlistInfo { Id = shortlistDBEntry.Id };
                }
            }
        }

        private async Task<IEnumerable<ShortListOfferRequest>> GetCustomerShortlist()
        {
            var customId = await _authenticationService.GetCustomerIdWithErrorsHandling();
            return await _shortListService.GetUserShortList(customId);
        }

        private async Task<ShortListOffersResponse> SearchShortListOffers(IEnumerable<ShortListOfferRequest> requestsToSearch, int page, int take)
        {
            requestsToSearch = await FilterHotelsAndLinkAtcomIdWithGiata(requestsToSearch.ToList());
            requestsToSearch = await RemoveHotelMissingFromCms(requestsToSearch);

            var response = new ShortListOffersResponse()
            {
                Status = new Status() { Total = (uint)requestsToSearch.Count() },
                Offers = [],
            };

            if (!requestsToSearch.Any())
            {
                return response;
            }

            requestsToSearch = OrderAndPagginateResults(requestsToSearch, page, take);

            foreach (var request in requestsToSearch)
            {
                try
                {
                    var offer = await GetOfferInformation(request);
                    response.Offers.Add(offer);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Cannot get offer info for {Id} due to {Message}", request?.Id, ex.Message);
                }
            }

            await _airportsMapper.EnrichAirportDetails([.. response.Offers]);

            return response;
        }

        /// <summary>
        /// Connects the atcom id with giata.
        /// </summary>
        /// <param name="requestsToSearch">Requests to search.</param>
        /// <param name="shouldLinkAccommodations"></param>
        /// <returns>A Task.</returns>
        private async Task<List<ShortListOfferRequest>> FilterHotelsAndLinkAtcomIdWithGiata(List<ShortListOfferRequest> requestsToSearch, bool shouldLinkAccommodations = true)
        {
            var hotelSearches = requestsToSearch.Where(x => x.ShortListType == ShortListType.Hotel).ToList();
            var hotelWithGiataRequestToSearch = hotelSearches.Where(x => x.GiataCode != null).ToList();
            var hotelsWithAccommodationRequestToSearch = hotelSearches.Where(x => x.ShortListType == ShortListType.Hotel && x.AccommodationId != null).ToList();

            var hotelGiataIds = hotelWithGiataRequestToSearch.Select(x => x.GiataCode).ToList();
            if (hotelGiataIds.Count > 0)
            {
                var giatasAccommodations = await _hotelsService.GetAccomodationsByGiata(hotelGiataIds);
                var allPossibleAccommodationsByGiatas = giatasAccommodations.Values.SelectMany(x => x).ToList();

                hotelsWithAccommodationRequestToSearch.RemoveAll(x => allPossibleAccommodationsByGiatas.Contains(x.AccommodationId));
                if (shouldLinkAccommodations)
                    AddAtcomIdForHotelGiataEntries(hotelWithGiataRequestToSearch, giatasAccommodations);
            }

            var accommodationsIds = hotelsWithAccommodationRequestToSearch.Select(x => x.AccommodationId).ToList();
            if (accommodationsIds.Count > 0)
            {
                var hotels = await _hotelsService.Search(accommodationsIds.ToArray());

                var filteredHotelsWithAccomodations = hotelsWithAccommodationRequestToSearch
                    .GroupBy(x => hotels.FirstOrDefault(h => h.Code.Equals(x.AccommodationId, StringComparison.OrdinalIgnoreCase))?.GiataCode)
                    .Select(g => g.FirstOrDefault()).ToList();
                hotelsWithAccommodationRequestToSearch = filteredHotelsWithAccomodations;
            }

            var filteredOffers = requestsToSearch
                .Where(o => o.ShortListType != ShortListType.Hotel)
                .Concat(hotelWithGiataRequestToSearch)
                .Concat(hotelsWithAccommodationRequestToSearch).ToList();

            return filteredOffers;
        }

        /// <summary>
        /// Adds the atcom id for hotel giata entries.
        /// </summary>
        /// <param name="hotelWithGiataRequestToSearch">The hotel with giata request to search.</param>
        /// <param name="giataAccommodations">The giata accommodations.</param>
        private static void AddAtcomIdForHotelGiataEntries(List<ShortListOfferRequest> hotelWithGiataRequestToSearch, Dictionary<string, HashSet<string>> giataAccommodations)
        {
            foreach (var hotelRequest in hotelWithGiataRequestToSearch)
            {
                if (giataAccommodations.TryGetValue(hotelRequest.GiataCode, out var accomodationsIds))
                {
                    hotelRequest.AccommodationId = accomodationsIds?.FirstOrDefault();
                }
            }
        }

        private async Task<ShortListOffersResponse> SearchShortListSummary(IEnumerable<ShortListOfferRequest> requestsToSearch, bool omitUnavailable)
        {
            requestsToSearch = await RemoveHotelMissingFromCms(requestsToSearch);

            if (!requestsToSearch.Any())
            {
                return new ShortListOffersResponse()
                {
                    Status = new Status() { Total = 0 },
                    Offers = [],
                };
            }

            var offersBag = new ConcurrentBag<Offer>();
            async Task ProcessRequest(ShortListOfferRequest request)
            {
                var offer = await GetOfferSummary(request, omitUnavailable);
                if (offer == null)
                    return;

                offersBag.Add(offer);
            }

            await Task.WhenAll(requestsToSearch.Select(ProcessRequest));

            var offers = offersBag.ToList();

            await _airportsMapper.EnrichAirportDetails([.. offers]);

            return new ShortListOffersResponse()
            {
                Status = new Status() { Total = (uint)offers.Count },
                Offers = offers,
            };
        }

        private async Task<IEnumerable<ShortListOfferRequest>> RemoveHotelMissingFromCms(IEnumerable<ShortListOfferRequest> requestsToSearch)
        {
            // Remove missing hotels from response
            var hotelCodes = requestsToSearch.Select(a => a.AccommodationId).ToArray();
            var missingHotelsInCms = (await _hotelsService.GetMissingCodes(hotelCodes)) ?? new List<string>();
            return requestsToSearch.Where(request => !missingHotelsInCms.Contains(request.AccommodationId));
        }

        private async Task<int> GetFilteredSavedOffersCount(string customId)
        {
            var dynamoDbResult = await _shortListService.GetUserShortList(customId) ?? Enumerable.Empty<ShortListOfferRequest>();
            var filteredOffers = await FilterHotelsAndLinkAtcomIdWithGiata(dynamoDbResult.ToList(), false);
            return filteredOffers?.Count ?? 0;
        }

        private static IEnumerable<ShortListOfferRequest> OrderAndPagginateResults(IEnumerable<ShortListOfferRequest> requestsToSearch, int page, int take)
        {
            requestsToSearch = requestsToSearch.OrderByDescending(x => !DateTime.TryParse(x.CreatedAt, CultureInfo.InvariantCulture, out DateTime dt) ? DateTime.MinValue : dt);

            take = take > 0 && take <= 100 ? take : 10;
            page = page > 0 ? page : 1;

            requestsToSearch = requestsToSearch.Skip((page - 1) * take);
            return requestsToSearch.Take(take);
        }

        private async Task<Offer> GetOfferInformation(ShortListOfferRequest request)
        {
            Offer offerInfo;
            var date = DateFormatUtils.Parse(request.StartDate).DateTime;
            var prom = $"XX{request.ITheme}"; // Default prom base on request

            if (date > DateTime.UtcNow)
            {
                var atcomResult = await _accommodationOfferService.SearchAccommodationOffer(request);
                var offer = atcomResult.Offers?.FirstOrDefault();
                if (offer != null)
                {
                    offerInfo = offer;
                    prom = offer.Accom?.Prom;
                }
                else
                {
                    // Build unavailable package if holiday is no longer available
                    offerInfo = await BuildUnavailableOffer(request);
                }
            }
            else
            {
                // Build unavailable package if holiday start date is in past
                offerInfo = await BuildUnavailableOffer(request);
            }

            var hotels = await _hotelsService.Search([request.AccommodationId], request.Language);
            var hotelModel = hotels.FirstOrDefault();

            foreach (var unit in offerInfo.Accom?.Unit ?? new List<Unit>())
            {
                await _offerHotelMapper.EnrichBoardTypeAndRoomType(hotelModel, unit);
            }

            await MapTransferNamesFromCMS(offerInfo.Transfers);

            offerInfo.Hotel = await _offerHotelMapper.MapWithoutBoardsRooms(hotelModel, prom);
            offerInfo.GiataCode = hotelModel?.GiataCode;

            EnrichOfferShortlistInfo(offerInfo, request);
            offerInfo.Id = request.Id;

            return offerInfo;
        }

        private async Task MapTransferNamesFromCMS(IEnumerable<TransferItem> transferItems)
        {
            if (transferItems == null)
                return;

            var transferTypes = await _referenceDataService.GetTransfers();
            foreach (var transfer in transferItems)
            {
                if (string.IsNullOrEmpty(transfer.Code))
                    continue;

                var transferCode = TransfersServiceUtils.GetTransferCode(transfer.Code);
                if (transferTypes.TryGetValue(transferCode, out var transferType))
                    transfer.Name = transferType.Name;
            }
        }

        private async Task<Offer> GetOfferSummary(ShortListOfferRequest request, bool ignoreUnavailable)
        {
            Offer offerInfo;
            var date = DateFormatUtils.Parse(request.StartDate).DateTime;

            if (date > DateTime.UtcNow)
            {
                var atcomResult = await _accommodationOfferService.SearchAccommodationOffer(request);
                var offer = atcomResult.Offers?.FirstOrDefault();
                if (offer != null)
                {
                    offerInfo = offer;
                }
                else
                {
                    if (ignoreUnavailable)
                        return null;

                    // Build unavailable package if holiday is no longer available
                    offerInfo = await BuildUnavailableOffer(request);
                }
            }
            else
            {
                if (ignoreUnavailable)
                    return null;

                // Build unavailable package if holiday start date is in past
                offerInfo = await BuildUnavailableOffer(request);
            }

            EnrichOfferShortlistInfo(offerInfo, request);

            return offerInfo;
        }

        private static void EnrichOfferShortlistInfo(Offer offer, ShortListOfferRequest request)
        {
            offer.Shortlist ??= new ShortlistInfo
            {
                Id = request.Id,
                Type = request.ShortListType,
                MarketCode = request.MarketCode,
                Language = request.Language
            };
        }

        private async Task<Offer> BuildUnavailableOffer(ShortListOfferRequest request)
        {
            DateTime date = DateFormatUtils.Parse(request.StartDate).DateTime;
            var (theme, type) = await _hotelThemeService.GetTheme($"XX{request.ITheme}");

            var childrenAges = (request.ChildAges != null ? request.ChildAges.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries) : new string[0])
                .Select(y =>
                    {
                        uint.TryParse(y, out var res);
                        return res;
                    });
            var defaultUnit = new List<Unit>()
            {
                new ()
                {
                    Occupation = new Occupation()
                    {
                        Adults = 2
                    }
                }
            };

            return new Offer()
            {
                Date = date,
                Transfers = new List<TransferItem>()
                {
                    new()
                    {
                        Code = request.Transfer,
                        Type = TransfersServiceUtils.GetTransferType(request.Transfer, _atcomSettings.Transfers.Types),
                    }
                },
                Transport = new Transport()
                {
                    Routes = new List<Route>
                    {
                        new()
                        {
                            RouteId = "1",
                            Direction = Direction.Outbound,
                            DepPt = request.IDepAirport ?? "",
                            ArrPt = request.IArrAirport ?? ""
                        },
                        new()
                        {
                            RouteId = "2",
                            Direction = Direction.Inbound,
                            DepPt = request.IArrAirport ?? "",
                            ArrPt = request.IDepAirport ?? ""
                        },
                    }
                },
                Accom = new Accom()
                {
                    Code = request.AccommodationId,
                    Date = date,
                    PackageId = request.PackageId,
                    Theme = theme,
                    Type = type,
                    Prom = LuggageService.BuildPromCode(
                        request.MarketCode,
                        request.ITheme,
                        _atcomSettings.ComplimentaryLuggage
                    ),
                    Unit = request.Room?.Select(x =>
                    {
                        var ages = childrenAges.Take(x.Children);
                        childrenAges = childrenAges.Skip(x.Children);
                        return new Unit()
                        {
                            Board = request.BoardType,
                            Code = x.RoomCode,
                            Occupation = new Occupation()
                            {
                                Adults = x.Adults,
                                Children = x.Children,
                                Infants = x.Infants,
                                ChildAges = ages.ToList(),
                            },
                        };
                    }).ToList() ?? defaultUnit,
                    Stay = (byte)(request.Duration?.FirstOrDefault() ?? 0)
                }
            };
        }
    }
}
