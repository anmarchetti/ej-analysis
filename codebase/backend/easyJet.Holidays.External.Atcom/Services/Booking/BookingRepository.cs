#nullable enable
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.PriceChanges;
using easyJet.Holidays.Api.Domain.Interfaces.Seats;
using easyJet.Holidays.Api.Domain.Interfaces.Transliteration;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.ApiResponseValidators;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.Booking;
using easyJet.Holidays.External.Atcom.Models.Internal;
using easyJet.Holidays.External.Atcom.Models.ModifyBooking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Domain.Models.Api;
using Force.DeepCloner;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using BookingRequest = easyJet.Holidays.Api.Domain.Data.Booking.BookingRequest;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;
using BookingSearchRequest = easyJet.Holidays.External.Atcom.Models.Booking.BookingSearchRequest;
using BookingSearchResponse = easyJet.Holidays.External.Atcom.Models.Booking.BookingSearchResponse;
using InfoBookingRequest = easyJet.Holidays.External.Atcom.Models.InfoBooking.InfoBookingRequest;
using InfoBookingResponse = easyJet.Holidays.External.Atcom.Models.InfoBooking.InfoBookingResponse;
using Memo = easyJet.Holidays.Api.Domain.Data.Booking.Memo;
using Person = easyJet.Holidays.Api.Domain.Data.Guests.Person;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;
using Seat = easyJet.Holidays.Api.Domain.Data.Booking.Seat;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using System.Diagnostics.CodeAnalysis;
using easyJet.Holidays.External.B2B;

namespace easyJet.Holidays.External.Atcom.Services.Booking
{
    /// <summary>
    /// CRUD operations for booking
    /// </summary>
    public class BookingRepository : IBookingRepository
    {
        private readonly EndpointsProvider _atcomRequestBuilder;
        private readonly IApiService _apiService;
        private readonly AtcomRequestGenerator _atcomRequestGenerator;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AtcomSettings _atcomSettings;
        private readonly ISettingsService _settingsService;
        private readonly IAuthenticationService _authenticationService;
        private readonly ITransferService _transferService;
        private readonly IPriceChangesService _priceChangesService;
        private readonly IPricesService _priceService;
        private readonly ILogger<BookingRepository> _logger;
        private readonly RequestBookingMapper _requestBookingMapper;
        private readonly InfoBookingMapper _infoBookingMapper;
        private readonly IModifyBookingMapper _modifyBookingMapper;
        private readonly ISeatingService _seatingService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly ApiResponseValidators _apiResponseValidators;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IMarketService _marketService;
        private readonly IB2BBookingService _b2BBookingService;
        private readonly IOfferPriceService _offerPriceService;
        private readonly IFlightExtraSearchService _flightExtraSearchService;
        private readonly IValidationAmendmentsService _validationAmendmentsService;
        private readonly ILuggageService _luggageService;
        private readonly ILuggageValidatorService _luggageValidatorService;
        private readonly PriceMapper _priceMapper;
        private readonly ITransliterationService _transliterationService;
        private readonly IMetricsService _metricsService;
        private readonly IOtelAnalyticsService _otelAnalyticsService;
        private readonly IBookingResponsePromotionCollectionsService _promotionCollectionsService;

        private Uri BookingRequest =>
                 _atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies);

        public BookingRepository(
          IApiService apiService,
          EndpointsProvider atcomRequestBuilder,
          AtcomRequestGenerator atcomRequestGenerator,
          IHttpContextAccessor httpContextAccessor,
          IOptions<AtcomSettings> atcomSettings,
          ISettingsService settingsService,
          IAuthenticationService authenticationService,
          ITransferService transferService,
          IPriceChangesService priceChangesService,
          IPricesService priceService,
          IReferenceDataService referenceDataService,
          ILogger<BookingRepository> logger,
          RequestBookingMapper requestBookingMapper,
          InfoBookingMapper infoBookingMapper,
          IModifyBookingMapper modifyBookingMapper,
          ITradeAgentAuthenticationService tradeAgentAuthService,
          ISeatingService seatingService,
          ApiResponseValidators apiResponseValidators,
          IMarketService marketService,
          IB2BBookingService b2BBookingService,
          IOfferPriceService offerPriceService,
          IFlightExtraSearchService flightExtraSearchService,
          IValidationAmendmentsService validationAmendmentsService,
          ILuggageService luggageService,
          PriceMapper priceMapper,
          ILuggageValidatorService luggageValidatorService,
          ITransliterationService transliterationService,
          IMetricsService metricsService,
          IOtelAnalyticsService otelAnalyticsService,
          IBookingResponsePromotionCollectionsService promotionCollectionsService)
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _logger = logger;
            _authenticationService = authenticationService;
            _apiService = apiService;
            _atcomRequestBuilder = atcomRequestBuilder;
            _atcomRequestGenerator = atcomRequestGenerator;
            _httpContextAccessor = httpContextAccessor;
            _settingsService = settingsService;
            _transferService = transferService;
            _priceChangesService = priceChangesService;
            _priceService = priceService;
            _seatingService = seatingService;
            _seatingService = seatingService;
            _tradeAgentAuthService = tradeAgentAuthService;
            _referenceDataService = referenceDataService;
            _marketService = marketService;
            _b2BBookingService = b2BBookingService;
            _offerPriceService = offerPriceService;
            _flightExtraSearchService = flightExtraSearchService;
            _validationAmendmentsService = validationAmendmentsService;
            _luggageService = luggageService;
            _luggageValidatorService = luggageValidatorService;
            _transliterationService = transliterationService;
            _metricsService = metricsService;
            _otelAnalyticsService = otelAnalyticsService;
            _promotionCollectionsService = promotionCollectionsService;


            // mappers
            _requestBookingMapper = requestBookingMapper;
            _infoBookingMapper = infoBookingMapper;
            _referenceDataService = referenceDataService;
            _modifyBookingMapper = modifyBookingMapper;
            _apiResponseValidators = apiResponseValidators;
            _priceMapper = priceMapper;
        }

        /// <inheritdoc />
        // TODO Talk to AntT why do we need both request and bookingRequest in arguments list
        [ExcludeFromCodeCoverage]
        public async Task<ValidateBookingResponse> Validate(ValidateBookingRequest request, bool stateful, BookingRequest bookingRequest = null, bool silenceTransferError = false, bool skipPriceJumpValidation = false)
        {
            /*
            * TODO Business requirement is to use special "no transfer" item if transfer isn't selected
            * But now it's possible to send "DEFAULT" code and get offer without transfer.
            * If Atcom will have all offers with  at least 1 transfer we can add validation (now we have offers without transfer, so it's valid case)
            * And to validate we need to do Search to get default transfer. ItemSearchRequest doesn't include it by default
            */

            // First of all get rid of synthetic offers
            request.Offer.Transfers = request.Offer.Transfers?.Where(x => !x.Code.StartsWith(_atcomSettings.Transfers.Types.SyntheticNoTransfer)).ToList();
            // And get more info if necessary
            request.Offer.Transfers = (await _transferService.BuildTransfers(request.Offer, silenceTransferError))?.ToList();

            EnsureSeatSelectionForAllNonInfants(request.SeatSelection, request.Guests);

            var promo = request.Offer.Accom.Prom;
            await EnrichSeatSelectionWithB2BData(request.Offer?.Transport?.Routes, request.Offer!.Currency.Code, request.SeatSelection, promo);

            await _luggageService.ValidateBookingLuggage(request);
            var market = _marketService.GetCurrentMarket();
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(true, request.Offer.PromotionCollections);

            var atcomRequest = InfoBookingMapper.BuildInfoBookingRequest(request, cltInfo, _atcomSettings.InternalFlightPromotionCode, _atcomRequestGenerator.GetCurrentAtcomLanguage());

            if (stateful)
            {
                var orderedGuests = GuestUtils.SortGuests(bookingRequest.Guests, x => x.Type);

                for (var i = 0; i < atcomRequest.Pax.Length; i++)
                {
                    var pax = atcomRequest.Pax[i];
                    var guest = orderedGuests[i]; // Note that it's safe to get by index only because we already sorted both collection in the same way

                    pax.Person.FirstName = _transliterationService.ToEnglish(guest.FirstName);
                    pax.Person.LastName = _transliterationService.ToEnglish(guest.LastName);
                    pax.Person.Title = guest.Title;

                    // set DoB for children guests
                    if (guest.Type == PersonType.Child)
                    {
                        pax.Person.DateOfBirth = DateFormatUtils.DateOnly(guest.DateOfBirth.Value.Date);
                    }

                    if (guest.Type == PersonType.Infant)
                    {
                        pax.Person.Title = "Infant";
                    }

                    // set DoB for lead passenger
                    if (i == 0)
                    {
                        pax.Person.DateOfBirth = DateFormatUtils.DateOnly(bookingRequest.LeadPassenger.DateOfBirth.Date);
                    }
                }
            }

            var infoBookingRequest = new InfoBookingRequest
            {
                Payload =
                    {
                        Body = atcomRequest
                    },
                Endpoint = BookingRequest
            };

            if (!stateful)
            {
                infoBookingRequest.Payload.Body.DiscardSession = true;
            }

            var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
            var extraPriceBreakdownSettings = await _referenceDataService.GetExtraPriceBreakdownSettings();

            try
            {
                var bookingInfoResponse = await _apiService.GetResponseContentAsyncWithErrorMapping<InfoBookingRequest, InfoBookingResponse>(
                    infoBookingRequest, ApiExceptionCodes.SearchPackagesError);

                var validateBookingResponce = await MapAndValidateResponse(bookingInfoResponse, promo);
                await LogAndSendAvailabilityMetrics(string.Empty, request, MetricConstants.SuccessMetricStatus);
                return validateBookingResponce;
            }
            catch (ApiException ex)
            {
                if (ex.InnerErrors != null)
                {
                    // Handle flight-related errors
                    if (ex.InnerErrors.Any(apiError => _atcomSettings.FlightAvailabilityRelatedErrorCodes?.Contains(apiError.Code, StringComparer.InvariantCultureIgnoreCase) == true))
                    {
                        await LogAndSendAvailabilityMetrics("FLIGHT_UNAVAILABLE", request, MetricConstants.FailureMetricStatus);
                        
                        // There is a seat error in the response
                        if (ex.InnerErrors.Any(error => _atcomSettings.SeatsRelatedErrorCodes?.Contains(error.Code, StringComparer.InvariantCultureIgnoreCase) ?? false))
                        {
                            if ((ex.InnerException as ErrorResponseException)?.Response is InfoBookingResponse infoBookingResponse)
                            {
                                // If there is a price jump, throw the price jump error first
                                await MapAndValidateResponse(infoBookingResponse, promo);
                            }

                            // If no price jump, throw the seats error
                            _logger.LogError(ex, "Seat selection related error found in Atcom response");
                            throw new ApiException(ApiExceptionCodes.BookingSeatReservationError, ex.InnerErrors, ex);
                        }
                    }
                    // Handle availability-related errors
                    else if (ex.InnerErrors.Any(apiError => _atcomSettings.AccommodationAvailabilityRelatedErrorCodes?.Contains(apiError.Code, StringComparer.InvariantCultureIgnoreCase) == true))
                    {
                        await LogAndSendAvailabilityMetrics("ACCOMMODATION_UNAVAILABLE", request, MetricConstants.FailureMetricStatus);
                    }
                    
                    // Handle airport parking errors
                    else if (ex.InnerErrors.Any(apiError => _atcomSettings.AirportParkingRelatedErrorCodes?.Contains(apiError.Code, StringComparer.InvariantCultureIgnoreCase) == true))
                    {
                        await LogAndSendAvailabilityMetrics("AIRPORT_PARKING_UNAVAILABLE", request, MetricConstants.FailureMetricStatus);
                    }
                    else
                    {
                        await LogAndSendAvailabilityMetrics("UNCLASSIFIED", request, MetricConstants.FailureMetricStatus);
                    }
                }
                // Rethrow any other errors
                throw;
            }

            async Task<ValidateBookingResponse> MapAndValidateResponse(InfoBookingResponse bookingInfoResponse, string promo)
            {
                var response = await _infoBookingMapper.Map(bookingInfoResponse, priceBreakdownSettings);
                var luggageSettings = await _referenceDataService.GetLuggageSettings();

                await EnrichSeatSelectionWithB2BData(request.Offer?.Transport?.Routes, market.Currency.Code, response.SeatSelection, promo);

                response.ExtraPriceBreakdown = _priceMapper.MapExtraPriceBreakdown(
                    response.PriceBreakdown,
                    extraPriceBreakdownSettings,
                    luggageSettings,
                    response.SeatSelection,
                    response.ExtraLuggageInfo,
                    response.Guests);

                if (!skipPriceJumpValidation)
                {
                    await ValidatePriceJump(request, response, infoBookingRequest);
                }

                return response;
            }
        }

        /// <summary>
        /// Create booking in Atcom
        /// </summary>
        /// <param name="request">commit booking request</param>
        /// <returns>response from Atcom</returns>
        public async Task<BookingResponse> StartBooking(BookingRequest request, string bookingReference, string sessionId, string requestId)
        {
            try
            {
                var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(true, request.Offer.PromotionCollections);

                string customerId = await _authenticationService.MappedCustomerId();
                var bookingRequest = RequestBookingMapper.MapCreateWithoutPayment(request.LeadPassenger, cltInfo, sessionId, requestId, customerId, _atcomRequestGenerator.GetCurrentAtcomLanguage());
                bookingRequest.Endpoint = BookingRequest;

                var response = await _apiService.GetResponseContentAsyncWithErrorMapping<Models.Booking.BookingRequest, Models.Booking.BookingResponse>(
                    bookingRequest, ApiExceptionCodes.BookingCreateError);

                var benefits = await _referenceDataService.GetBenefits();
                var bookingResponse = await _requestBookingMapper.MapResponse(response.Payload.Body, null, benefits?.Children);

                await EnrichSeatSelectionWithB2BData(request.Offer?.Transport?.Routes, bookingResponse.Currency.Code, bookingResponse.SeatSelection, bookingResponse.Prom);

                var luggageSettings = await _referenceDataService.GetLuggageSettings();
                var extraPriceBreakdownSettings = await _referenceDataService.GetExtraPriceBreakdownSettings();

                bookingResponse.ExtraPriceBreakdown = _priceMapper.MapExtraPriceBreakdown(
                    bookingResponse.PriceBreakdown,
                    extraPriceBreakdownSettings,
                    luggageSettings,
                    bookingResponse.SeatSelection,
                    bookingResponse.ExtraLuggageInfo,
                    bookingResponse.Guests);

                return bookingResponse;
            }
            catch (ApiException ex)
            {
                throw new CommitBookingException("failed to create booking", bookingReference, ex.InnerErrors, sessionId, requestId, ex);
            }
        }

        /// <inheritdoc/>
        public async Task<BookingResponse> CancelBooking(string bookingReference, string reason, bool withoutFee, string marketCode, string language, IList<string> bookingPromotionKeys)
        {
            var cltInfo = _atcomRequestGenerator.BuildCltInfo(marketCode, language, true, bookingPromotionKeys);
            return await CancelBooking(bookingReference, cltInfo, reason, withoutFee);
        }

        /// <inheritdoc/>
        public async Task<BookingResponse> CancelBooking(string bookingReference, string reason, bool withoutFee, IList<string> bookingPromotionKeys)
        {
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(promotionAgentKey: bookingPromotionKeys);
            return await CancelBooking(bookingReference, cltInfo, reason, withoutFee);
        }

        private async Task<BookingResponse> CancelBooking(string bookingReference, CltInfo bookingCltInfo, string reason, bool withoutFee)
        {
            try
            {
                // build stateless request
                var request = RequestBookingMapper.MapCancellation(bookingCltInfo, bookingReference, reason, withoutFee);
                request.Endpoint = BookingRequest;

                CancellationBookingResponse response = null;
                try
                {
                    response = await _apiService.GetResponseContentAsyncWithErrorMapping<CancellationBookingRequest, CancellationBookingResponse>(
                        request, ApiExceptionCodes.BookingCancelError);
                }
                catch (ApiException ex)
                {
                    if (!(ex.InnerException is ErrorResponseException))
                    {
                        throw;
                    }

                    // During cancel it's possible that external service may fail, but Atcom anyway marks booking as cancelled
                    // Checking if response has valid body and status is cancelled
                    var errorExc = ex.InnerException as ErrorResponseException;

                    if (errorExc.Response == null || !(errorExc.Response is CancellationBookingResponse))
                    {
                        throw;
                    }

                    var errorResponse = errorExc.Response as CancellationBookingResponse;
                    if (errorResponse?.Payload?.Body?.BkgSts == Models.Internal.BkgSts.CANCELED)
                    {
                        // use response only if booking has status CANCELLED
                        response = errorResponse;
                        _logger.LogInformation("Cancel booking failed for {BookingReference}, but response is valid, ignore error", bookingReference);
                    }
                    else
                    {
                        throw;
                    }
                }

                var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
                var benefits = await _referenceDataService.GetBenefits();

                // Map from Atcom to holidays
                // for MVP we are ignoring any amendments and it's always ViewOnly
                return await _requestBookingMapper.MapResponse(response.Payload.Body, priceBreakdownSettings, benefits?.Children);
            }
            catch (ApiException aex)
            {
                throw new BookingCancellationException(ApiExceptionCodes.BookingCancelError, $"Failed to cancel the booking: {bookingReference}", bookingReference, aex.InnerErrors, aex);
            }
            catch (Exception ex)
            {
                throw new BookingCancellationException(ApiExceptionCodes.BookingCancelError, $"Failed to cancel the booking: {bookingReference}", bookingReference, null, ex);
            }
        }

        public async Task<AdvancedBookingSearchResponse> SearchBookings(AdvancedBookingSearchRequest request)
        {
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();
            var serviceRequest = RequestBookingMapper.MapSearch(request, cltInfo);
            serviceRequest.Endpoint = BookingRequest;

            var serviceResponse = await _apiService
                .GetResponseContentAsyncWithErrorMapping<BookingSearchRequest, BookingSearchResponse>(
                    serviceRequest, ApiExceptionCodes.BookingViewError);

            return RequestBookingMapper.MapAdvancedSearchResponse(serviceResponse);
        }

        /// <summary>
        /// Search bookings for customer
        /// </summary>
        /// <param name="customerId">Atcom customer id</param>
        /// <param name="isAgentRequired">Post booking no agent required tag</param>
        /// <returns>Stateful booking response</returns>
        public async Task<List<BookingResponse>> SearchBookings(string customerId, bool isAgentRequired = true)
        {
            // build stateless request
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(isAgentRequired);
            // remove Agent Number to get customers bookings independent of agent/market.
            cltInfo.Agt_No = string.Empty;

            var request = RequestBookingMapper.MapSearch(cltInfo, customerId);
            request.Endpoint = BookingRequest;

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<BookingSearchRequest, BookingSearchResponse>(
                request, ApiExceptionCodes.BookingViewError);

            var bookingRefs = response.Payload.Body?.BookingSearchResponseEntry?
                .Select(x => x.BkgNum?.BkgId).Where(x => !string.IsNullOrEmpty(x)).ToList() ?? new List<string>();

            var bookings = await Task.WhenAll(bookingRefs.Select(async bookingRef =>
            {
                try
                {
                    return await GetBooking(bookingRef);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Can not get booking by reference {BookingRef}", bookingRef);
                    return null;
                }
            }));

            return bookings.Where(x => x != null).ToList();
        }

        /// <summary>
        /// Obtain booking details by booking reference
        /// </summary>
        /// <param name="bookingReference">booking reference</param>
        /// <param name="supplierId">Optional supplier id</param>
        /// <returns>Stateful booking response</returns>
        public async Task<BookingResponse> GetBooking(string bookingReference, string supplierId = null)
        {
            return await GetBooking(bookingReference, new GetBookingOptions { SupplierId = supplierId });
        }

        /// <inheritdoc />
        public async Task<BookingResponse> GetBooking(GetBookingRequest request)
        {
            var booking = await GetBooking(request.BookingReference, request.SupplierId);

            if (booking == null || !ValidateLastName(request.LastName, booking) || !ValidateDate(request.Date, booking))
            {
                throw new ApiException(ApiExceptionCodes.BookingViewError, null, "Booking reference, lastName or departureDate is not valid");
            }

            return booking;
        }

        /// <inheritdoc />
        public async Task<BookingResponse> GetBooking(string bookingReference, GetBookingOptions bookingOptions)
        {
            var booking = await GetBookingUnsafe(bookingReference, bookingOptions);

            _logger.LogInformation("Got booking with status: {BookingStatus}, statuses to ignore: {Statuses}", booking.BookingStatus, string.Join(",", _atcomSettings.BookingIgnoreWithStatuses));

            if (_atcomSettings.BookingIgnoreWithStatuses.Contains(booking.BookingStatus))
            {
                _logger.LogWarning("Trying to get booking with status which should be ignored: {BookingStatus}, ref: {BookingReference}", booking.BookingStatus, bookingReference);
                return null;
            }

            return booking;
        }

        /// <inheritdoc />
        public async Task<BookingResponse> GetBaseBooking(string bookingReference, GetBookingOptions options = null)
        {
            var atcomBookingRequest = BuildAtcomBookingRequest(bookingReference, options);

            var response = options?.IgnoreAtcomErrors ?? false
                ? await _apiService
                    .GetResponseContentAsyncIgnoreErrors<DisplayBookingRequest,
                        DisplayBookingResponse>(atcomBookingRequest, ApiExceptionCodes.BookingViewError)
                : await _apiService
                    .GetResponseContentAsyncWithErrorMapping<DisplayBookingRequest,
                        DisplayBookingResponse>(atcomBookingRequest, ApiExceptionCodes.BookingViewError);

            var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
            var benefits = await _referenceDataService.GetBenefits();

            var booking = await _requestBookingMapper.MapResponse(response.Payload.Body, priceBreakdownSettings, benefits?.Children, options);
            booking.AmendmentInfo = ModifyBookingMapper.Map(response.Payload?.Body?.Amendments);
            booking.ApiWarnings = response.ApiWarnings;

            var luggageSettings = await _referenceDataService.GetLuggageSettings();
            var extraPriceBreakdownSettings = await _referenceDataService.GetExtraPriceBreakdownSettings();

            await _luggageService.GetComplimentaryLuggage(booking.Package);
            booking.ExtraPriceBreakdown = _priceMapper.MapExtraPriceBreakdown(
                booking.PriceBreakdown,
                extraPriceBreakdownSettings,
                luggageSettings,
                booking.SeatSelection,
                booking.ExtraLuggageInfo,
                booking.Guests);

            BookingUtils.EnrichAllowPayBalanceDueDate(booking,
                _atcomSettings.AllowPayOutstandingBalanceIsGreaterThanDays);

            // remove any possible supplier commission from payment model, keep it on trade portal
            if (string.IsNullOrEmpty(options?.SupplierId) && !_tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                booking.PaymentInfo.CommissionIncludingVAT = 0;
                booking.PaymentInfo.AgentComission = 0;
            }

            // Do post-validation
            if (booking.Package == null && options?.AllowNoAccomm != true)
            {
                _logger.LogError("No valid Accom in Package");
                throw new ApiException(ApiExceptionCodes.BookingViewError, null, "No accom in package");
            }

            return booking;
        }

        /// <summary>
        /// Obtain booking details by booking reference (return booking without booking status validation)
        /// </summary>
        /// <param name="bookingReference">booking reference</param>
        /// <param name="options">Options</param>
        /// <returns>Stateful booking response</returns>
        public async Task<BookingResponse> GetBookingUnsafe(string bookingReference, GetBookingOptions options = null)
        {
            var amendBookingSettings = await _referenceDataService.GetAmendBookingSetting();
            var booking = await GetBaseBooking(bookingReference, options);
            var memo = await GetBookingMemo(bookingReference);

            booking.B2BData = await _b2BBookingService.GetBooking(booking);

            //additionally amendments validation based on custom easyJet rules
            await _validationAmendmentsService.ValidateAmendments(booking, memo, amendBookingSettings);

            await _promotionCollectionsService.EnrichBookingResponsesWithPromotionCollectionsAsync([booking]);

            return booking;
        }

        /// <summary>
        /// Validate amendment booking request
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="amendRequest"></param>
        /// <param name="bookingResponse"></param>
        /// <param name="stateful"></param>
        /// <param name="sendExtraFlightInformationForInternalFlights"></param>
        /// <returns></returns>
        public async Task<ValidateAmendBookingResponse> ValidateAmendBookingInfo<T>(
            T amendRequest, BookingResponse bookingResponse, bool stateful, bool sendExtraFlightInformationForInternalFlights = false)
            where T : AmendInfoBookingRequest
        {
            return await ValidateAmendBookingInfo(
                amendRequest,
                bookingResponse,
                stateful,
                null,
                sendExtraFlightInformationForInternalFlights);
        }

        /// <summary>
        /// Confirm amend booking modification
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<BookingResponse> CommitAmendBooking(BookingRequest request)
        {
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();

            var modifyBookingRequest = ModifyBookingMapper.BuildModifyBookingRequest(cltInfo,
                request.BookingReference,
                request.SessionId,
                request.RequestId);

            modifyBookingRequest.Endpoint = BookingRequest;

            var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();

            // MakeApiCallWithErrorMapping
            var response =
                await _apiService
                    .GetResponseContentAsyncWithErrorMapping<ModifyBookingRequest,
                        ModifyBookingResponse>(modifyBookingRequest,
                        ApiExceptionCodes.BookingCommitError);

            // Map from Atcom to US
            var benefits = await _referenceDataService.GetBenefits();
            var bookingResponse = await _requestBookingMapper.MapResponse(response?.Payload?.Body,
                priceBreakdownSettings, benefits.Children);

            return bookingResponse;
        }

        /// <summary>
        /// Get booking memo by booking reference.
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <returns>Booking memo.</returns>
        public async Task<List<Memo>> GetBookingMemo(string bookingReference)
        {
            // build stateless request
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();
            var request = RequestBookingMapper.MapDisplayMemo(cltInfo, bookingReference);
            request.Endpoint = BookingRequest;

            var response = await _apiService.GetResponseContentAsyncWithErrorMapping<DisplayBookingMemoRequest, DisplayBookingMemoResponse>(
                request, ApiExceptionCodes.BookingViewError);

            // Map from Atcom to US
            // for MVP we are ignoring any amendments and it's always ViewOnly
            return RequestBookingMapper.MapMemos(response.Payload.Body.Memo);
        }

        /// <summary>
        /// Get booking memo by booking reference.
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="predicate">Filter expression to get specific booking.</param>
        /// <returns>Booking memo.</returns>
        public async Task<List<Memo>> GetBookingMemo(string bookingReference, Func<Memo, bool> predicate)
        {
            var memos = await GetBookingMemo(bookingReference);

            return memos?.Where(predicate).ToList();
        }

        /// <summary>
        /// Obtain booking details by booking reference
        /// </summary>
        /// <param name="bookingReference">booking reference</param>
        /// <returns>Stateful booking response</returns>
        public async Task ModifyMemo(string bookingReference, BookingMemo memo)
        {
            await ModifyMemo(bookingReference, new[] { memo });
        }

        /// <inheritdoc />
        public async Task ModifyMemo(string bookingReference, IEnumerable<BookingMemo> memos)
        {
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();
            var request = RequestBookingMapper.MapModifyMemo(cltInfo, bookingReference, memos);
            request.Endpoint = BookingRequest;

            await _apiService.GetResponseContentAsyncWithErrorMapping<Models.Booking.ModifyMemoRequest, Models.Booking.ModifyMemoResponse>(
                request, ApiExceptionCodes.BookingModifyMemo);
        }

        /// <inheritdoc />
        public async Task UpdateCustomerDetails(string bookingReference, string customerId)
        {
            // build stateless request
            var cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();
            var request = RequestBookingMapper.MapUpdateCustomerDetailsRequest(cltInfo, bookingReference, customerId);
            request.Endpoint = BookingRequest;

            await _apiService.GetResponseContentAsyncWithErrorMapping<Models.Booking.UpdateCustomerDetailsRequest, Models.Booking.UpdateCustomerDetailsResponse>(
                request, ApiExceptionCodes.BookingAssignUpdateCustomerId);
        }

        /// <summary>
        /// Build display booking request.
        /// </summary>
        /// <param name="bookingReference">Booking reference.</param>
        /// <param name="options" cref="GetBookingOptions">Reqeust booking options.</param>
        /// <returns cref="DisplayBookingRequest">Request body.</returns>
        private DisplayBookingRequest BuildAtcomBookingRequest(string bookingReference, GetBookingOptions options = null)
        {
            var cltInfo = new CltInfo();
            if (options != null && options.IsAgentRequired.HasValue)
            {
                cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo(options.IsAgentRequired.Value);
            }
            else
            {
                cltInfo = _atcomRequestGenerator.BuildCurrentCltInfo();
            }

            // build stateless request
            cltInfo = _atcomRequestGenerator.UseSupplierId(cltInfo, options?.SupplierId);

            var request = RequestBookingMapper.MapDisplay(cltInfo, bookingReference);
            request.Endpoint = BookingRequest;

            return request;
        }

        /// <summary>
        /// Make amend booking response.
        /// </summary>
        /// <param name="booking"></param>
        /// <param name="stateful"></param>
        /// <returns></returns>
        public async Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(BookingResponse booking, bool stateful = false)
        {
            try
            {
                var validateAmendBookingResponse = await GetValidateAmendBookingResponse(booking, stateful, _apiResponseValidators.ValidateAtcomResponseCatchApiPromocodeErrorsAction);

                return validateAmendBookingResponse;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private async Task<ValidateAmendBookingResponse> GetValidateAmendBookingResponse(
            BookingResponse booking,
            bool stateful = false, Action<ApiResponse> validateResponseAction = null)
        {
            var benefits = await _referenceDataService.GetBenefits();
            var infoModifyBookingRequest = _modifyBookingMapper.BuildInfoModifyBookingRequest(booking);

            if (!stateful)
            {
                infoModifyBookingRequest.DiscardSession = true;
            }

            var amendBookingRequest = new InfoModifyBookingRequest
            {
                Endpoint = BookingRequest,
                Payload = { Body = infoModifyBookingRequest },
                ValidateResponse = validateResponseAction
            };

            var infoModifyBookingResponse = validateResponseAction != null
                ? await _apiService
                    .GetResponseContentAsyncWithCustomErrorMapping<InfoModifyBookingRequest,
                        InfoModifyBookingResponse>(
                        amendBookingRequest,
                        ApiExceptionCodes.BookingModifyError)
                : await _apiService
                    .GetResponseContentAsyncWithErrorMapping<InfoModifyBookingRequest,
                        InfoModifyBookingResponse>(
                        amendBookingRequest,
                        ApiExceptionCodes.BookingModifyError);

            var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
            var validateAmendBookingResponse = await _modifyBookingMapper.Map(infoModifyBookingResponse, priceBreakdownSettings, benefits.Children, false);

            EnhanceResponse(booking, validateAmendBookingResponse);

            return validateAmendBookingResponse;
        }

        private void EnhanceResponse(BookingResponse booking, ValidateAmendBookingResponse validateAmendBookingResponse)
        {
            validateAmendBookingResponse.PaymentInfo.AmendmentCharges =
                validateAmendBookingResponse.PaymentInfo.TotalPrice - booking.PaymentInfo.TotalPrice;

            //Handle case when BalanceDueAmount < 0
            //This happens when a refund/credit action on a booking has failed in the past due to an error in the payment system
            //In the result there is no payment information about refund/credit in Atcom and this booking has negative BalanceDueAmount
            if (booking.PaymentInfo.BalanceDueAmount < 0)
            {
                validateAmendBookingResponse.PaymentInfo.AmendmentCharges += booking.PaymentInfo.BalanceDueAmount;
            }
        }

        private async Task<ValidateAmendBookingResponse> ValidateAmendBookingInfo<T>(
            T amendRequest, BookingResponse bookingResponse, bool stateful, Action<ApiResponse> validateResponseAction, bool sendExtraFlightInformationForInternalFlights = false)
            where T : AmendInfoBookingRequest
        {
            ValidateModifyBookingRequest(amendRequest, bookingResponse);
            var promotion = bookingResponse?.Package?.Accom?.Prom;
            var luggage = amendRequest?.ExtraLuggageInfo?.Items;
            var guests = bookingResponse?.Guests?.ToArray();
            var routes = bookingResponse?.Package?.Transport?.Routes?.ToArray();

            await _luggageValidatorService.ValidateComplimentaryLuggage(promotion, luggage, guests, routes);
            await _luggageValidatorService.Validate(luggage, guests, routes?.Select(x => x.RouteId).ToArray());

            var benefits = await _referenceDataService.GetBenefits();
            var market = _marketService.GetMarket(bookingResponse.MarketCode);
            var amendedBookingResponse = bookingResponse.DeepClone();

            if ((bookingResponse.Package?.Transport?.Routes?.All(x => !x.IsExternal) ?? false) && !sendExtraFlightInformationForInternalFlights)
            {
                // If we do amendment dates on internal transport
                // we need to remove any luggage otherwise Atcom adds any bags to new amendment booking
                // ignoring promotions configuration
                amendedBookingResponse.ExtraLuggageInfo = new ExtraLuggageInfo { Items = new List<ExtraLuggageItem>() };
            }

            await PrepareBookingResponseForAmendment();
            var infoModifyBookingRequest = _modifyBookingMapper.BuildInfoModifyBookingRequest(amendedBookingResponse, sendExtraFlightInformationForInternalFlights);

            if (!stateful)
            {
                infoModifyBookingRequest.DiscardSession = true;
            }

            var amendBookingRequest = new InfoModifyBookingRequest
            {
                Endpoint = BookingRequest,
                Payload = { Body = infoModifyBookingRequest },
                ValidateResponse = validateResponseAction
            };

            var infoModifyBookingResponse = validateResponseAction != null
                ? await _apiService
                    .GetResponseContentAsyncWithCustomErrorMapping<InfoModifyBookingRequest,
                        InfoModifyBookingResponse>(
                        amendBookingRequest,
                        ApiExceptionCodes.BookingModifyError)
                : await _apiService
                    .GetResponseContentAsyncWithErrorMapping<InfoModifyBookingRequest,
                        InfoModifyBookingResponse>(
                        amendBookingRequest,
                        ApiExceptionCodes.BookingModifyError);

            var priceBreakdownSettings = await _settingsService.GetPriceBreakdownSettings();
            var validateAmendBookingResponse = await _modifyBookingMapper.Map(infoModifyBookingResponse, priceBreakdownSettings, benefits.Children, _tradeAgentAuthService.IsLoggedInAsTradeAgent());

            EnhanceResponse(bookingResponse, validateAmendBookingResponse);

            if (SeatsUtils.HasSelectedSeats(amendRequest.SeatSelection))
            {
                validateAmendBookingResponse.SeatSelection = amendRequest.SeatSelection; // Use seat selection with latest B2B data
            }

            return validateAmendBookingResponse;

            async Task PrepareBookingResponseForAmendment()
            {
                // Update the cloned booking response with the amend request data in order to create an InfoModifyBookingRequest from it

                if (!amendRequest.Transfers.IsNullOrEmpty())
                {
                    amendedBookingResponse.Transfers = amendRequest.Transfers.ToList();
                }

                if (amendRequest.Transport != null)
                {
                    amendedBookingResponse.Package.Transport = amendRequest.Transport;
                    amendedBookingResponse.SeatSelection = null;
                }

                if (amendRequest.Pax != null)
                {
                    amendedBookingResponse.Guests = amendRequest.Pax.Select(x => x as PersonWithDetails).ToList();
                    amendedBookingResponse.AmendmentInfo.PromoCode = amendedBookingResponse.DiscountCode;
                }

                if (SeatsUtils.HasSelectedSeats(amendRequest.SeatSelection))
                {
                    amendedBookingResponse.SeatSelection = amendRequest.SeatSelection;

                    await UpdateSeatSelectionFromB2BAndValidate(
                        amendedBookingResponse.Package?.Transport?.Routes,
                        market.Currency.Code,
                        amendedBookingResponse.SeatSelection,
                        amendedBookingResponse.Prom,
                        bookingResponse.SeatSelection,
                        benefits);

                    EnsureSeatSelectionForAllNonInfants(amendedBookingResponse.SeatSelection, amendedBookingResponse.Guests);
                }

                if (amendRequest.Offer is not null)
                {
                    amendedBookingResponse.Transfers = amendRequest.Offer.Transfers;
                    amendedBookingResponse.Package.Transport = amendRequest.Offer.Transport;

                    if (SeatsUtils.HasSelectedSeats(amendRequest.Offer.SeatSelection))
                    {
                        amendedBookingResponse.SeatSelection = amendRequest.Offer.SeatSelection;

                        await UpdateSeatSelectionFromB2BAndValidate(
                            amendedBookingResponse.Package?.Transport?.Routes,
                            market.Currency.Code,
                            amendedBookingResponse.SeatSelection,
                            amendedBookingResponse.Prom,
                            bookingResponse.SeatSelection,
                            benefits);

                        EnsureSeatSelectionForAllNonInfants(amendedBookingResponse.SeatSelection, amendedBookingResponse.Guests);
                    }
                    else
                    {
                        amendedBookingResponse.SeatSelection = null;
                    }

                    amendedBookingResponse.Package.Accom.StartDate = DateFormatUtils.DateOnly(amendRequest.Offer.Accom.Date);
                    amendedBookingResponse.Package.Accom.EndDate = DateFormatUtils.DateOnly(amendRequest.Offer.Accom.Date.Date.AddDays(amendRequest.Offer.Accom.Stay));
                    amendedBookingResponse.Package.Accom.Rooms = amendRequest.Offer.Accom.Unit;
                }

                if (amendRequest.Units is not null)
                {
                    amendedBookingResponse.Package.Accom.Rooms = amendRequest.Units;
                }

                if (amendRequest.AmendHotelOffer is not null)
                {
                    amendedBookingResponse!.Package!.Accom.Code = amendRequest.AmendHotelOffer.Accom.Code;
                    amendedBookingResponse.Package.Accom.Prom = amendRequest.AmendHotelOffer.Accom.Prom;
                    amendedBookingResponse.Package.Accom.Rooms = amendRequest.AmendHotelOffer.Accom.Unit;
                    amendedBookingResponse.Transfers = amendRequest.AmendHotelOffer.Transfers?.ToList();
                }

                if (!string.IsNullOrEmpty(amendRequest.DiscountCode))
                {
                    amendedBookingResponse.AmendmentInfo.PromoCode = amendRequest.DiscountCode;
                }
            }
        }

        /// <summary>
        /// Validate Booking departure date
        /// </summary>
        /// <param name="booking">booking to validate</param>
        /// <param name="departureDate">departure date from UI</param>
        /// <returns></returns>
        private static bool ValidateDate(DateTime departureDate, BookingResponse booking)
        {
            var outboundRoute = booking.Package.Transport.Routes.FirstOrDefault(r => r.Direction == Direction.Outbound);
            if (outboundRoute?.DepDate == null) return false;

            return outboundRoute.DepDate.Value.Date == departureDate.Date;
        }

        /// <summary>
        /// Validate Booking Guest last name
        /// </summary>
        /// <param name="booking">booking to validate</param>
        /// <param name="lastName">guest last name from UI</param>
        /// <returns></returns>
        private bool ValidateLastName(string lastName, BookingResponse booking)
        {
            var transliteratedLastName = _transliterationService.ToEnglish(lastName);
            return booking.Guests.FirstOrDefault(x => x.LastName.Equals(transliteratedLastName, StringComparison.InvariantCultureIgnoreCase)) != null;
        }

        /// <summary>
        /// Validate modify booking request
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="request"></param>
        /// <param name="bookingResponse"></param>
        /// <exception cref="ApiException"></exception>
        private static void ValidateModifyBookingRequest<T>(T request,
            BookingResponse bookingResponse) where T : AmendInfoBookingRequest
        {
            if (request.Transport != null && !request.Transport.Routes.IsNullOrEmpty() && !bookingResponse.AmendmentInfo.Route)
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingRoutes,
                    null,
                    "Can't change routes");
            }

            if (!request.Transfers.IsNullOrEmpty() && !bookingResponse.AmendmentInfo.Transfer.AmendAllow)
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingTransfers,
                    null,
                    "Can't change transfers");
            }

            if (request.Offer is not null && !bookingResponse.AmendmentInfo.ChangeDates)
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingDatesLimit,
                    null,
                    "Can't change date");
            }

            if (request.Units is not null && !bookingResponse.AmendmentInfo.RoomAndBoard)
            {
                throw new ApiException(ApiExceptionCodes.AmendRoomLimit,
                    null,
                    "Can not change room or board");
            }

            if (request.AmendHotelOffer is not null && !bookingResponse.AmendmentInfo.Accom)
            {
                throw new ApiException(ApiExceptionCodes.AmendHotelRestriction,
                    null,
                    "Can not change hotel.");
            }
        }

        private async Task EnrichSeatSelectionWithB2BData(IEnumerable<Route> routes, string currencyCode, List<SeatMap> seatSelection, string promo)
        {
            if (seatSelection == null || !seatSelection.Any())
            {
                return;
            }

            foreach (var seatMap in seatSelection.Where(seatMap => seatMap.Seats?.Any() ?? false))
            {
                var route = routes?.SingleOrDefault(r => r.FlightNumberWithoutCar == seatMap.FlightNumber);
                if (route == null || !route.DepDate.HasValue || string.IsNullOrWhiteSpace(route.DepPt) || string.IsNullOrWhiteSpace(route.ArrPt))
                {
                    continue;
                }

                var b2BSeatsMap = await GetB2BSeatsMap(currencyCode, promo, route);

                foreach (var seat in seatMap.Seats)
                {
                    var b2BSeat = b2BSeatsMap?.SingleOrDefault(s => s.Number == seat.SeatNumber);
                    if (b2BSeat == null)
                    {
                        continue;
                    }

                    seat.PriceBand = string.IsNullOrEmpty(b2BSeat.PriceBand) ? SeatPriceBands.Standard : b2BSeat.PriceBand;
                    seat.Price = b2BSeat.Price;
                    seat.Products = b2BSeat.Products.Select(p => new Product { Id = p.Id, Name = p.Name, Description = p.Description, Icon = p.Icon }).ToList();
                }
            }
        }

        private async Task<List<Holidays.Api.Domain.Data.DynamoDB.Bookings.Seat>> GetB2BSeatsMap(string currencyCode, string promo, Route route)
        {
            var seatsMapRequest = new GetSeatsMapRequest(route, currencyCode);
            if (!string.IsNullOrEmpty(promo))
                seatsMapRequest.Promo = promo;

            var b2BSeatsMap = await _seatingService.GetCachedSeatsMap(seatsMapRequest);
            return b2BSeatsMap;
        }

        private async Task UpdateSeatSelectionFromB2BAndValidate(IEnumerable<Route> routes, string currencyCode, List<SeatMap> newSeatSelection, string promo, List<SeatMap> oldSeatSelection, Benefits cmsBenefits)
        {
            if (newSeatSelection == null || !newSeatSelection.Any())
            {
                return;
            }

            foreach (var seatMap in newSeatSelection.Where(seatMap => seatMap.Seats?.Any() ?? false))
            {
                var oldSeatMap = oldSeatSelection?.SingleOrDefault(s => s.FlightNumber == seatMap.FlightNumber);
                var route = routes?.SingleOrDefault(r => r.FlightNumberWithoutCar == seatMap.FlightNumber);

                var b2BSeatsMap = (await _seatingService.GetSeatsMap(new GetSeatsMapRequest(route, currencyCode) { Promo = promo }))
                    .Rows?
                    .SelectMany(row => row.Blocks)
                    .SelectMany(block => block.Seats)
                    .ToDictionary(seat => seat.Number, seat => seat);

                foreach (var seat in seatMap.Seats)
                {
                    ValidateAndUpdateSeat(seat, oldSeatMap, b2BSeatsMap, cmsBenefits);
                }
            }
        }

        static void ValidateAndUpdateSeat(Seat seat, SeatMap oldSeatMap, Dictionary<string, SeatMapSeat> b2BSeatsMap, Benefits cmsBenefits)
        {
            SeatMapSeat b2BSeat = null;
            b2BSeatsMap?.TryGetValue(seat.SeatNumber, out b2BSeat);

            VerifySeatPriceAndAvailability(oldSeatMap, seat, b2BSeat);

            var oldSeat = oldSeatMap?.Seats?.SingleOrDefault(s => s.PaxIndex == seat.PaxIndex);

            // Seat downgrade, no refund intended
            if ((oldSeat?.Price ?? 0) > seat.Price)
            {
                // Don't send seats prices to Atcom to avoid negative BalanceDueAmount
                seat.Price = 0;
            }

            seat.PriceBand = string.IsNullOrEmpty(b2BSeat!.PriceBand) ? SeatPriceBands.Standard : b2BSeat.PriceBand;
            UpdateSeatProducts(seat, b2BSeat, oldSeat, b2BSeatsMap, cmsBenefits);
        }

        static void VerifySeatPriceAndAvailability(SeatMap oldSeatMap, Seat seat, SeatMapSeat b2BSeat)
        {
            bool seatAlreadyBooked = oldSeatMap?.Seats?.Any(s => s.SeatNumber == seat.SeatNumber) ?? false;
            if (b2BSeat == null || (!seatAlreadyBooked && !b2BSeat.IsAvailable))
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingSeatsUnavailable);
            }

            if (seat.Price != b2BSeat.Price)
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingSeatsPriceChanged);
            }
        }

        static void UpdateSeatProducts(Seat seat, SeatMapSeat b2BSeat, Seat oldSeat, Dictionary<string, SeatMapSeat> b2BSeatsMap, Benefits cmsBenefits)
        {
            // If premium->premium amendment, take products from the request to comply with the CB3 rules for pre-cutoff bookings, see SEATS-417
            if (b2BSeat.IsPremiumSeat && IsPremiumSeat(oldSeat, b2BSeatsMap))
            {
                foreach (var product in seat.Products)
                {
                    var cmsBenefit =
                        cmsBenefits?.Children?.SingleOrDefault(b => b.Code == product.Id && b.IsVisibleOnSeatMapPlan);
                    if (cmsBenefit == null)
                    {
                        continue;
                    }

                    product.Name = cmsBenefit.Name;
                    product.Description = cmsBenefit.Description;
                    product.Icon = cmsBenefit.Icon;
                }
            }
            else // Take all products from the B2B response
            {
                seat.Products = b2BSeat.Products
                    .Select(p => new Product
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Icon = p.Icon
                    })
                    .ToList();
            }
        }

        static bool IsPremiumSeat(Seat seat, Dictionary<string, SeatMapSeat> b2BSeatsMap)
        {
            SeatMapSeat b2BSeat = null;
            if (seat != null)
            {
                b2BSeatsMap?.TryGetValue(seat.SeatNumber, out b2BSeat);
            }

            return b2BSeat?.IsPremiumSeat ?? false;
        }

        private async Task ValidatePriceJump(ValidateBookingRequest request,
            ValidateBookingResponse response,
            InfoBookingRequest infoBookingRequest)
        {
            var market = _marketService.GetMarket(response.MarketCode);
            decimal totalPrice = _offerPriceService.GetOfferPriceWithoutExtras(response.PaymentInfo, response);
            decimal pricePerPerson = await _offerPriceService.GetOfferPricePerPersonWithoutExtras(response.PaymentInfo, response);

            // Check if need round for result price. Needed to compare price from frontend(rounded) and price from atcom.
            decimal vrpPrice = request.NoRoundingPrice ? totalPrice : _priceService.RoundPrice(totalPrice);

            // Check if need round for result price. Needed to compare price from frontend(rounded) and price from atcom.
            decimal vrpPricePp = request.NoRoundingPrice ? pricePerPerson : _priceService.RoundPrice(pricePerPerson);

            // Prices passed from frontend, taken from the atcom cache
            decimal cachePrice = request.Offer?.PriceExcludingTouristTax ?? 0;
            decimal cachePricePp = request.Offer?.PricePPExcludingTouristTax ?? 0;
            
            try
            {
                // Log price changes
                await _priceChangesService.CreatePriceChangeRecord(
                    infoBookingRequest?.Payload?.SerializedBody,
                    market,
                    cachePrice,
                    vrpPrice,
                    cachePricePp,
                    vrpPricePp);
            }
            catch (ApiException e) when (e.Code.Equals(ApiExceptionCodes.SearchPackagesPriceJumpError))
            {
                // Increment the OpenTelemetry metric
                await LogAndSendPriceJumpAvailabilityErrorMetrics(request, vrpPrice, vrpPricePp);

                // Rethrow the exception to allow further handling
                throw;
            }
        }

        private static void EnsureSeatSelectionForAllNonInfants<T>(List<SeatMap> seatSelection, List<T> guests) where T : Person
        {
            if (seatSelection.IsNullOrEmpty() || guests.IsNullOrEmpty())
            {
                return;
            }

            var requiredSeatsNumber = guests.Count(person => person.Type != PersonType.Infant);
            if (seatSelection.Any(seatMap =>
                !seatMap.Seats.IsNullOrEmpty() &&
                requiredSeatsNumber != seatMap.Seats.Select(seat => seat.PaxIndex).Distinct().Count()))
            {
                throw new ApiException(ApiExceptionCodes.BookingSeatSelectionIncomplete);
            }
        }
        
        private async Task LogAndSendAvailabilityMetrics(string errorReason, ValidateBookingRequest request, string status)
        {
            _metricsService.IncrementCounter(MetricConstants.WebPackageAvailabilityCheckTotal, 1,
                new KeyValuePair<string, object>("result", status),
                new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(request.Offer?.Accom?.Code)),
                new KeyValuePair<string, object>("error_reason", errorReason),
                new KeyValuePair<string, object>("market_code", _marketService.GetCurrentMarket()?.Code));
            await _otelAnalyticsService.TrackAvailabilityMetricsAsync(request, errorReason, status);
        }
        
        private async Task LogAndSendPriceJumpAvailabilityErrorMetrics(ValidateBookingRequest request, decimal vrpPrice, decimal vrpPricePp)
        {
            var errorReason = "PRICE_JUMP";
            
            _metricsService.IncrementCounter(MetricConstants.WebPackageAvailabilityCheckTotal, 1,
                new KeyValuePair<string, object>("result", MetricConstants.FailureMetricStatus),
                new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(request.Offer?.Accom?.Code)),
                new KeyValuePair<string, object>("error_reason", errorReason),
                new KeyValuePair<string, object>("market_code", _marketService.GetCurrentMarket()?.Code));
            await _otelAnalyticsService.TrackPriceJumpAvailabilityMetricsAsync(request, errorReason, MetricConstants.FailureMetricStatus, vrpPrice, vrpPricePp);
        }
    }
}
