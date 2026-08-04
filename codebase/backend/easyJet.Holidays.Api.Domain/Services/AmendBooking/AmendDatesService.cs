using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Mappers.Interfaces;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Comparers;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
namespace easyJet.Holidays.Api.Domain.Services.AmendBooking;

public class AmendDatesService : IAmendDatesService
{
    private readonly IAvailableDatesOfferSearchService _availableDatesOfferSearchService;
    private readonly IBookingRepository _bookingRepository;
    private readonly IValidateBookingResponseMapper _validateBookingResponseMapper;
    private readonly ITransferService _transferService;
    private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
    private readonly ILanguageService _languageService;
    private readonly IFreeNightsService _freeNightsService;
    private readonly IErrataInfoService _errataInfoService;
    private readonly ISettingsService _settingsService;
    private readonly IAmendSeatsService _amendSeatsService;
    private readonly ILogger<AmendDatesService> _logger;
    private readonly AmendBookingChangeDatesSettings _changeDatesSettings;

    /// <summary>
    /// Constructor for AmendDatesService
    /// </summary>
    public AmendDatesService(
        IAvailableDatesOfferSearchService availableDatesOfferSearchService,
        IBookingRepository bookingRepository,
        IValidateBookingResponseMapper validateBookingResponseMapper,
        ITransferService transferService,
        IAmendPromocodeHandlerService amendPromocodeHandlerService,
        ILanguageService languageService,
        IFreeNightsService freeNightsService,
        IErrataInfoService errataInfoService,
        IAmendSeatsService amendSeatsService,
        ISettingsService settingsService,
        ILogger<AmendDatesService> logger,
        IOptions<ApiSettings> apiSettings)
    {
        _availableDatesOfferSearchService = availableDatesOfferSearchService;
        _bookingRepository = bookingRepository;
        _validateBookingResponseMapper = validateBookingResponseMapper;
        _transferService = transferService;
        _amendPromocodeHandlerService = amendPromocodeHandlerService;
        _languageService = languageService;
        _freeNightsService = freeNightsService;
        _errataInfoService = errataInfoService;
        _amendSeatsService = amendSeatsService;
        _settingsService = settingsService;
        _logger = logger;
        _changeDatesSettings = apiSettings?.Value.AmendBookingChangeDates;
    }

    /// <inheritdoc />
    public async Task<AmendDateInfoResponse> GetAvailableBookingDate(AmendDateInfoRequest request)
    {
        var availableDateResult = await _availableDatesOfferSearchService.AvailableDates(request);

        return availableDateResult;
    }

    /// <inheritdoc />
    public async Task<AmendDatesOffer> GetAmendDatesSummary(AmendDatesSummaryRequest request, CancellationToken cancellationToken = default)
    {
        // 1. Search for offers that fully match the search criteria
        var originalBooking = await _bookingRepository.GetBooking(request.BookingRef);

        var availablePackages = await _availableDatesOfferSearchService.SearchFullMatchedOffer(request);

        var offersByDepartureTime = availablePackages?.Offers
            ?.SortOffersByOriginalBooking(originalBooking)
            ?.EnrichWithExtraLuggage(originalBooking);

        int numberOfValidateAttempts = 0;

        foreach (var offer in offersByDepartureTime)
        {
            ThrowIfRequestWasCancelledByTheClient(cancellationToken);
            ThrowIfMaxNumberOfValidateAttemptsReached(numberOfValidateAttempts);

            var result = await ValidateAmendDatesOffer(offer, originalBooking);
            if (result is not null)
            {
                await EnrichResult(result);
                return result;
            }
            numberOfValidateAttempts++;
        }

        // 2. Search for cheapest offers
        //unhappy path, try to find offers that do not fully match search criteria
        ThrowIfMaxNumberOfValidateAttemptsReached(numberOfValidateAttempts);

        var cheapestPackage = await _availableDatesOfferSearchService.SearchCheapestOffer(request);

        RemoveDuplicates(availablePackages, cheapestPackage);
        cheapestPackage?.Offers?.EnrichWithExtraLuggage(originalBooking);

        if (cheapestPackage?.Offers?.Any() == true)
        {
            var result = await ValidateAmendDatesOffer(cheapestPackage?.Offers.First(), originalBooking);
            if (result is not null)
            {
                await EnrichResult(result);
                result.UnhappyPathOffer = true;
                return result;
            }
            numberOfValidateAttempts++;
        }

        // 3. Search for all other offers
        ThrowIfMaxNumberOfValidateAttemptsReached(numberOfValidateAttempts);

        var allAvailablePackages = await _availableDatesOfferSearchService.SearchNotFullyMatchedOffer(request);

        RemoveDuplicates(availablePackages, allAvailablePackages);
        var offersByPrice = allAvailablePackages?.Offers
            ?.SortByPrice()
            ?.EnrichWithExtraLuggage(originalBooking) ?? [];

        foreach (var offer in offersByPrice)
        {
            ThrowIfRequestWasCancelledByTheClient(cancellationToken);
            ThrowIfMaxNumberOfValidateAttemptsReached(numberOfValidateAttempts);

            var result = await ValidateAmendDatesOffer(offer, originalBooking);
            if (result is not null)
            {
                await EnrichResult(result);
                result.UnhappyPathOffer = true;
                return result;
            }
            numberOfValidateAttempts++;
        }

        throw new ApiException(ApiExceptionCodes.GetAvailableDatesSummaryInformation, HttpStatusCode.BadRequest);
    }

    private void ThrowIfRequestWasCancelledByTheClient(CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested)
        {
            _logger.LogError("Client cancelled the request");
            throw new ApiException(ApiExceptionCodes.RequestCancelledException, HttpStatusCode.BadRequest);
        }
    }

    private void ThrowIfMaxNumberOfValidateAttemptsReached(int numberOfAttempts)
    {
        if (numberOfAttempts == _changeDatesSettings.MaxNumberOfAttemptsForValidatingOffer)
        {
            throw new ApiException(ApiExceptionCodes.GetAvailableDatesSummaryInformation, HttpStatusCode.BadRequest);
        }
    }

    private void RemoveDuplicates(SearchOffersResponse availablePackages, SearchOffersResponse allAvailablePackages)
    {
        if (availablePackages is null || allAvailablePackages is null)
            return;

        foreach (var offer in availablePackages.Offers)
        {
            var duplicate = allAvailablePackages.Offers.FirstOrDefault(x => OfferComparer.Equals(offer, x));
            allAvailablePackages.Offers.Remove(duplicate);
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<AmendDatesOffer>> ValidateAmendDatesOffers(IEnumerable<AmendDatesOffer> requestOffers)
    {
        var languageCode = _languageService.GetCurrentLanguage();
        var seatMapSettings = await _settingsService.GetSeatMapSettings();
        if (requestOffers.IsNullOrEmpty())
        {
            return Enumerable.Empty<AmendDatesOffer>();
        }

        var bookingRef = requestOffers.First().BookingRef;

        var booking = await _bookingRepository.GetBooking(bookingRef);

        var resultsTasks = requestOffers.Select(requestOffer => ValidateAmendDatesOffer(requestOffer.Offer, booking, requestOffer));

        var result = await Task.WhenAll(resultsTasks);

        result = result.Where(x => x is not null).ToArray();

        foreach (var amendDatesOffer in result)
        {
            await _amendSeatsService.UpdateSeatsInformation(amendDatesOffer);
        }

        foreach (var amendDatesOffer in result)
        {
            await _freeNightsService.EnrichWithFreeNightsInfo(
                amendDatesOffer.Offer.Accom.Code,
                amendDatesOffer.Offer.Accom.Date,
                amendDatesOffer.Offer.Accom.Stay,
                amendDatesOffer.Offer.Accom.Unit);

            await _errataInfoService.EnrichWithFlightErrataInfo(amendDatesOffer.Offer.Transport, languageCode);
            await _errataInfoService.EnrichWithErrataInfo(amendDatesOffer.Offer, languageCode);
            amendDatesOffer.SeatsChangeEnabled = seatMapSettings.EnableSeatMapDateChange;
        }

        return result;
    }

    private async Task EnrichResult(AmendDatesOffer result)
    {
        var languageCode = _languageService.GetCurrentLanguage();
        var seatMapSettings = await _settingsService.GetSeatMapSettings();
        await _transferService.EnrichWithTransferInfo(result.Offer.Transfers, languageCode);
        await _errataInfoService.EnrichWithFlightErrataInfo(result.Offer.Transport, languageCode);
        await _errataInfoService.EnrichWithErrataInfo(result.Offer, languageCode);
        result.SeatsChangeEnabled = seatMapSettings.EnableSeatMapDateChange;
    }

    /// <summary>
    /// Validates the amend dates offer. Returns null if the offer is not valid.
    /// </summary>
    /// <param name="offer">The offer.</param>
    /// <param name="booking">The booking.</param>
    /// <param name="requestOffer">The request offer.</param>
    /// <returns>Valid AmendDateOfferwith calculated price.</returns>
    private async Task<AmendDatesOffer> ValidateAmendDatesOffer(Offer offer, BookingResponse booking, AmendDatesOffer requestOffer = null)
    {
        var bookingResponse = booking.MergeWithOffer(offer);

        if (booking.Package.Transport.Routes.All(x => x.IsExternal) is false)
        {
            // if we amend a booking with internal flights to external, we empty the extra luggage.
            // Atcom moves the luggage ignore promo code settings, to handle it correct it needs empty luggage.
            bookingResponse.ExtraLuggageInfo = new ExtraLuggageInfo { Items = new List<ExtraLuggageItem>() };
        }

        bookingResponse.Transfers = (await _transferService.BuildTransfers(offer, true))?.ToList();

        var validatedOfferResponse = await _bookingRepository.GetValidateAmendBookingResponse(bookingResponse);

        // Check if the response is null. Exception in Atcom catch and convert to null.
        if (validatedOfferResponse is null)
        {
            return null;
        }

        // Check if the transport is the same as the one requested
        if (!AmendTransportComparer.Equals(validatedOfferResponse?.Transport, offer?.Transport))
        {
            return null;
        }

        if (booking.HasPromocode())
        {
            validatedOfferResponse = await _amendPromocodeHandlerService.HandlePromocode(bookingResponse, booking, validatedOfferResponse);
        }

        var result = await _validateBookingResponseMapper.MapToAmendDatesOffer(validatedOfferResponse, booking, requestOffer);

        return result;
    }
}