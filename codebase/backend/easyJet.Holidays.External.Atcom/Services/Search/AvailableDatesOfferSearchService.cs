using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Search;
using easyJet.Holidays.External.Atcom.Models.Internal.Search;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services.Search;

public class AvailableDatesOfferSearchService : IAvailableDatesOfferSearchService
{
    private readonly SearchRequestsMapper _searchRequestsMapper;
    private readonly AtcomSettings _atcomSettings;
    private readonly SearchOffersService _searchOffersService;
    private readonly IMarketService _marketService;
    private readonly IReferenceDataService _referenceDataService;
    private readonly IBookingRepository _bookingRepository;
    private readonly IOffersMapper _offersMapper;

    public AvailableDatesOfferSearchService(
        SearchRequestsMapper searchRequestsMapper,
        IOptions<AtcomSettings> atcomSettings,
        SearchOffersService searchOffersService,
        IMarketService marketService,
        IReferenceDataService referenceDataService,
        IBookingRepository bookingRepository,
        IOffersMapper offersMapper)
    {
        _searchRequestsMapper = searchRequestsMapper;
        _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
        _searchOffersService = searchOffersService;
        _marketService = marketService;
        _referenceDataService = referenceDataService;
        _bookingRepository = bookingRepository;
        _offersMapper = offersMapper;
    }

    /// <inheritdoc />
    public async Task<AmendDateInfoResponse> AvailableDates(AmendDateInfoRequest request)
    {
        var searchRequest = _searchRequestsMapper.MapAmendDateInfo(request, _atcomSettings.EndpointTemplate.SearchDates);

        var amendBookingSetting = await _referenceDataService.GetAmendBookingSetting();

        var availableDateChangeDates = DateTime.UtcNow.AddHours(Convert.ToDouble(amendBookingSetting.ChangeDatesThresholdHours));

        var availableDatesOffer = await _searchOffersService.DoSearch(searchRequest, _marketService.GetCurrentMarket()?.Code);

        var result = new AmendDateInfoResponse();

        var amendDates = new List<AmendDate>();

        foreach (var offer in availableDatesOffer.Payload.Body.Result.Offers.Offer)
        {
            if (offer.Avail == YesNo.Y)
                result.AvailableHoliday = true;

            amendDates.Add(
            new AmendDate
            {
                Date = DateFormatUtils.DateOnly(offer.Date),
                IsAvailable = offer.Avail == YesNo.Y && offer.Date > availableDateChangeDates
            });
        }

        result.AmendDates = amendDates;

        return result;
    }

    /// <inheritdoc />
    public async Task<SearchOffersResponse> SearchFullMatchedOffer(AmendDatesSummaryRequest request, bool includeTransfer = true)
    {
        var searchRequest = _searchRequestsMapper.MapAmendDateSummaryInfo(request, includeTransfer);
        var originalBooking = await _bookingRepository.GetBooking(request.BookingRef);
        var response = await _searchOffersService.DoSearch(searchRequest, originalBooking.MarketCode);
        var marketSettings = _marketService.GetMarket(originalBooking.MarketCode);

        var offers = await _offersMapper.Map(response, marketSettings);

        return offers;
    }

    /// <inheritdoc />
    public async Task<SearchOffersResponse> SearchNotFullyMatchedOffer(AmendDatesSummaryRequest request)
    {
        var searchRequest = _searchRequestsMapper.MapNotFullyMatchedAmendDateSummaryInfo(request);
        var originalBooking = await _bookingRepository.GetBooking(request.BookingRef);
        var response = await _searchOffersService.DoSearch(searchRequest, originalBooking.MarketCode);
        var marketSettings = _marketService.GetMarket(originalBooking.MarketCode);

        var offers = await _offersMapper.Map(response, marketSettings);

        return offers;
    }

    /// <inheritdoc />
    public async Task<SearchOffersResponse> SearchCheapestOffer(AmendDatesSummaryRequest request)
    {
        var searchRequest = _searchRequestsMapper.MapCheapestPackageRequest(request);
        var originalBooking = await _bookingRepository.GetBooking(request.BookingRef);
        var response = await _searchOffersService.DoSearch(searchRequest, originalBooking.MarketCode);
        var marketSettings = _marketService.GetMarket(originalBooking.MarketCode);

        var offers = await _offersMapper.Map(response, marketSettings);

        return offers;
    }
}