using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.Offers;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.Net;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.Api.Controllers.Booking;

/// <summary>
/// Controller for booking operations
/// </summary>
[Route("booking")]
[ApiController]
[ApiVersion("1.0")]
#pragma warning disable S6960
public class BookingController : ControllerBase
{
    private readonly IBookingFetchService _bookingService;
    private readonly IBookingCreateService _bookingCreateService;
    private readonly IPostBookingService _postBookingService;
    private readonly IBookingCreditService _bookingCreditService;
    private readonly IBookingChangeService _bookingChangeService;
    private readonly IBookingTokenService _bookingTokenService;
    private readonly IHotelsService _hotelsService;
    private readonly IIdempotentBookingService _idempotentBookingService;
    private readonly HeadersSettings _headerSettings;
    private readonly ApiSettings _apiSettings;
    private readonly IPricesService _priceService;
    private readonly IAuthenticationService _authenticationService;
    private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
    private readonly ISettingsService _settingsService;
    private readonly IReferenceDataService _referenceDataService;
    private readonly IMetricsService _metricsService;
    private readonly IOtelAnalyticsService _otelAnalyticsService;
    private readonly IMarketService _marketService;

    private const string CanNotGetConfirmationMessage = "Can not get confirmation";

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="bookingService"></param>
    /// <param name="postBookingService"></param>
    /// <param name="bookingCreditService"></param>
    /// <param name="bookingChangeService"></param>
    /// <param name="bookingTokenService"></param>
    /// <param name="bookingCreateService"></param>
    /// <param name="hotelsService"></param>
    /// <param name="idempotentBookingService"></param>
    /// <param name="headerSettings"></param>
    /// <param name="apiSettings"></param>
    /// <param name="priceService"></param>
    /// <param name="authenticationService"></param>
    /// <param name="tradeAgentAuthService"></param>
    /// <param name="settingsService"></param>
    /// <param name="referenceDataService"></param>
    /// <param name="otelAnalyticsService"></param>
    /// <param name="metricsService"></param>
    /// <param name="marketService"></param>
    /// <exception cref="ArgumentNullException"></exception>
#pragma warning disable S107
    public BookingController(
        IBookingFetchService bookingService,
        IPostBookingService postBookingService,
        IBookingCreditService bookingCreditService,
        IBookingChangeService bookingChangeService,
        IBookingTokenService bookingTokenService,
        IBookingCreateService bookingCreateService,
        IHotelsService hotelsService,
        IIdempotentBookingService idempotentBookingService,
        IOptions<HeadersSettings> headerSettings,
        IOptions<ApiSettings> apiSettings,
        IPricesService priceService,
        IAuthenticationService authenticationService,
        ITradeAgentAuthenticationService tradeAgentAuthService,
        ISettingsService settingsService,
        IReferenceDataService referenceDataService,
        IOtelAnalyticsService otelAnalyticsService,
        IMetricsService metricsService,
        IMarketService marketService)
#pragma warning restore S107
    {
        ArgumentNullException.ThrowIfNull(headerSettings);
        ArgumentNullException.ThrowIfNull(apiSettings);

        _headerSettings = headerSettings.Value ?? throw new ArgumentNullException(nameof(headerSettings));
        _bookingService = bookingService;
        _postBookingService = postBookingService;
        _hotelsService = hotelsService;
        _idempotentBookingService = idempotentBookingService;
        _priceService = priceService;
        _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
        _bookingCreditService = bookingCreditService;
        _bookingChangeService = bookingChangeService;
        _bookingTokenService = bookingTokenService;
        _bookingCreateService = bookingCreateService;
        _tradeAgentAuthService = tradeAgentAuthService;
        _authenticationService = authenticationService;
        _settingsService = settingsService;
        _referenceDataService = referenceDataService;
        _metricsService = metricsService;
        _otelAnalyticsService = otelAnalyticsService;
        _marketService = marketService ?? throw new ArgumentNullException(nameof(marketService));
    }

    /// <summary>
    /// validate booking availability and price
    /// </summary>
    /// <returns>availability and up to date package price</returns>
    [HttpPost]
    [Route("validate-package")]
    [ProducesResponseType(typeof(ValidateBookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> Validate([FromBody] ValidateBookingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_apiSettings.Vouchers.IsActive && !string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            return BadRequest("Discount is disabled");
        }

        var response = await _bookingCreateService.Validate(request, false, null, true);

        RoundResponsePrices(request, response);

        response.CreditIsEnabled = _apiSettings.Vouchers.IsActive;

        if (request.Offer.Transfers?.Count > 0 && response.Transfers?.Count > 0)
        {
            var hotelTransfers = (await _hotelsService.GetHotelTransfers(new[] { response.Accom.Code }))?.SelectMany(x => x);
            await TransfersServiceUtils.EnrichCmsData(response.Transfers, request.Offer.Transport, hotelTransfers, _referenceDataService);
        }

        return Ok(response);
    }

    /// <summary>
    /// Validates the provided promotional code.
    /// </summary>
    /// <param name="request">The promotional code request containing discount details.</param>
    /// <returns>Returns an IActionResult containing the validation response.</returns>
    /// <exception cref="ArgumentNullException">Thrown if the request parameter is null.</exception>
    [HttpPost]
    [Route("validate-promo-code")]
    [ProducesResponseType(typeof(ValidateBookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> ValidatePromoCode([FromBody] ValidateBookingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (!_apiSettings.Vouchers.IsActive && !string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            return BadRequest("Discount is disabled");
        }
        
        try
        {
            var response = await _bookingCreateService.Validate(request, false, null, true);

            RoundResponsePrices(request, response);

            response.CreditIsEnabled = _apiSettings.Vouchers.IsActive;
            
            await TrackPromoCodeValidation(request, isSuccess: true, errorCode: null);
            
            return Ok(response);
        }
        catch (ApiException apiEx)
        {
            await TrackPromoCodeValidation(request, isSuccess: false, errorCode: apiEx.Code.Code);
            throw;
        }
        catch (Exception)
        {
            // Track unknown errors with UNKNOWN source
            await TrackPromoCodeValidation(request, isSuccess: false, errorCode: null);
            throw;
        }
    }

    /// <summary>
    /// Commit booking, including payment information
    /// </summary>
    /// <returns>Search results</returns>
    /// <response code="200">Booking confirmation response</response>
    /// <response code="400">Bad requests, parameters do no match</response>
    /// <response code="503">Server-side error has occurred</response>
    [HttpPost]
    [Route("commit")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(MakePaymentResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(IdempotencyKeyAttribute))]
    [NoCacheControl]
    [EnforceKeyNamesForSensitiveDataInPaymentInfo]
    public async Task<IActionResult> Commit([FromBody] BookingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        await _authenticationService.CheckIfAccountIsLocked(request.LeadPassenger.Email, true);
        var isTradeAgent = _tradeAgentAuthService.IsLoggedInAsTradeAgent();
        try
        {
            // skip payment info validation in case that the booking is initiated by an agent
            if (!isTradeAgent)
            {
                if (request.PaymentInfo?.CreditAmount > 0 && !_apiSettings.Vouchers.IsActive)
                {
                    return BadRequest("Credit is disabled");
                }

                if (request.PaymentInfo == null || !request.PaymentInfo.ValidateByDefaultValue())
                {
                    throw new ApiException(ApiExceptionCodes.BookingPaymentInfoError,
                        ApiExceptionCodes.BookingPaymentInfoError.Description, null, null, HttpStatusCode.BadRequest);
                }
            }

            await ThrowIfSeatsSelectedAndSeatMapFlowDisabled(request);

            var idempotencyKey = Request.Headers[_headerSettings.IdempotencyKey];

            var finalAtcomResponse = await _idempotentBookingService.CreateBooking(request, idempotencyKey);
            
            await RecordPaymentAndPriceMetrics(request, isTradeAgent, finalAtcomResponse);

            return Ok(finalAtcomResponse);
        }
        catch (PaymentAuthorisationRequiredException pirEx)
        {
            return Ok(pirEx.PaymentResponse);
        }
    }

    /// <summary>
    /// Commit booking, including payment information
    /// </summary>
    /// <returns>Search results</returns>
    /// <response code="200">Booking confirmation response</response>
    /// <response code="400">Bad requests, parameters do no match</response>
    /// <response code="503">Server-side error has occurred</response>
    [HttpPost]
    [Route("pay-remaining-balance")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(MakePaymentResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(IdempotencyKeyAttribute))]
    [NoCacheControl]
    [EnforceKeyNamesForSensitiveDataInPaymentInfo]
    public async Task<IActionResult> PayRemainingBalance([FromBody] PayRemainingBalanceRequest request)
    {
        if (request == null)
        {
            return BadRequest("Request body cannot be null");
        }
        
        try
        {
            if (request.PaymentInfo?.CreditAmount > 0 && !_apiSettings.Vouchers.IsActive)
            {
                return BadRequest("Credit is disabled");
            }

            if (request.PaymentInfo == null || !request.PaymentInfo.ValidateByDefaultValue())
            {
                throw new ApiException(ApiExceptionCodes.BookingPaymentInfoError,
                    ApiExceptionCodes.BookingPaymentInfoError.Description, null, null, HttpStatusCode.BadRequest);
            }

            var idempotencyKey = Request.Headers[_headerSettings.IdempotencyKey];
            var bookingResponse = await _idempotentBookingService.PayRemainingBalance(request, idempotencyKey);

            return Ok(bookingResponse);
        }
        catch (PaymentAuthorisationRequiredException pirEx)
        {
            return Ok(pirEx.PaymentResponse);
        }
    }

    /// <summary>
    /// Get booking details
    /// </summary>
    /// <returns>Booking details</returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> Display([FromQuery] GetBookingRequest request)
    {
        var booking = await GetBooking(() => _bookingService.Get(request));
        booking.CreditIsEnabled = _apiSettings.Vouchers.IsActive;

        return Ok(booking);
    }

    /// <summary>
    /// Get booking details via POST to avoid sensitive data in URL parameters
    /// </summary>
    /// <returns>Booking details</returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpPost]
    [Route("retrieve")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> DisplayPost([FromBody] GetBookingRequest request)
    {
        var booking = await GetBooking(() => _bookingService.Get(request));
        booking.CreditIsEnabled = _apiSettings.Vouchers.IsActive;

        return Ok(booking);
    }

    /// <summary>
    /// Get booking status
    /// </summary>
    /// <param name="request"></param>
    /// <returns>Booking status</returns>
    /// <response code="200">Booking status</response>
    /// <response code="400">Bad request: no booking thus no status</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("state")]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> DisplayState([FromQuery] GetBookingRequest request)
    {
        var status = await GetBookingStatus(() => _bookingService.GetBookingStatus(request));

        return Ok(status);
    }

    /// <summary>
    /// Get booking details
    /// </summary>
    /// <returns>Booking details</returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("{token}")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> DisplayByToken(string token)
    {
        var booking = await GetBooking(() => _bookingService.Get(token));
        booking.CreditIsEnabled = _apiSettings.Vouchers.IsActive;

        return Ok(booking);
    }

    /// <summary>
    /// Get booking confirmation PDF
    /// </summary>
    /// <returns>Booking confirmation PDF file</returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("confirmation")]
    [ProducesResponseType(typeof(File), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> Confirmation([FromQuery] GetBookingRequest request)
    {
        try
        {
            var stream = await _postBookingService.Confirmation(request);

            if (stream == null)
            {
                throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, CanNotGetConfirmationMessage, null,
                    null, HttpStatusCode.BadRequest);
            }

            return File(stream, "application/pdf");
        }
        catch (ApiException ex)
        {
            // Don't want to return different errors if bookingReference is not correct(Atcom) or if  e.g. lastName is not valid
            // For public API it should be the same error. All details anyway will be logged in by underlying API
            throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, CanNotGetConfirmationMessage,
                ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
        }
    }

    /// <summary>
    /// Get booking confirmation PDF via POST to avoid sensitive data in URL parameters
    /// </summary>
    /// <returns>Booking confirmation PDF file</returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpPost]
    [Route("confirmation")]
    [ProducesResponseType(typeof(File), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> ConfirmationPost([FromBody] GetBookingRequest request)
    {
        try
        {
            var stream = await _postBookingService.Confirmation(request);

            return stream == null ? throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, CanNotGetConfirmationMessage, null, null, HttpStatusCode.BadRequest) : File(stream, "application/pdf");
        }
        catch (ApiException ex)
        {
            // Don't want to return different errors if bookingReference is not correct(Atcom) or if  e.g. lastName is not valid
            // For public API it should be the same error. All details anyway will be logged in by underlying API
            throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, CanNotGetConfirmationMessage,
                ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
        }
    }

    /// <summary>
    /// Get VAT invoice / payment receipt PDF
    /// </summary>
    /// <returns>VAT invoice PDF file</returns>
    /// <response code="200">Payment receipt PDF</response>
    /// <response code="400">Bad request</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("payment-receipt")]
    [ProducesResponseType(typeof(File), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> PaymentReceipt([FromQuery] GetBookingRequest request)
    {
        try
        {
            var stream = await _postBookingService.PaymentReceipt(request);

            if (stream == null)
            {
                throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, "Can not get payment receipt", null,
                    null, HttpStatusCode.BadRequest);
            }

            return File(stream, "application/pdf");
        }
        catch (ApiException ex)
        {
            // Don't want to return different errors if bookingReference is not correct(Atcom) or if e.g. lastName is not valid
            // For public API it should be the same error. All details anyway will be logged in by underlying API
            throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError, "Can not get payment receipt",
                ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
        }
    }

    /// <summary>
    /// Get list of existing bookings for authorized customer
    /// </summary>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("list")]
    [ProducesResponseType(typeof(List<BookingResponse>), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> List()
    {
        try
        {
            var bookings = await _postBookingService.MyBookings();

            foreach (var booking in bookings)
            {
                // Load hotel details from sitecore
                await _hotelsService.EnrichBookingResponse(booking);
                booking.CreditIsEnabled = _apiSettings.Vouchers.IsActive;
            }

            return Ok(bookings);
        }
        catch (ApiException ex)
        {
            // Don't want to return different errors if bookingReference is not correct(Atcom) or if  e.g. lastName is not valid
            // For public API it should be the same error. All details anyway will be logged in by underlying API
            throw new ApiException(ApiExceptionCodes.BookingListError, "Can not get list of bookings",
                ex.InnerErrors, ex.InnerException, HttpStatusCode.InternalServerError);
        }
    }

    /// <summary>
    /// Commit booking, including payment information
    /// </summary>
    /// <returns>Search results</returns>
    /// <response code="200">Booking confirmation response</response>
    /// <response code="400">Bad request: booking is already assgined or cannot be assigned to logged in customer</response>
    /// <response code="503">Server-side error has occurred</response>
    [HttpPost]
    [Route("assign")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> Assign([FromBody] AssignBookingRequest request)
    {
        try
        {
            await _postBookingService.Assign(request);
            return Ok();
        }
        catch (ApiException ex)
        {
            // These exceptions should have 400 code
            var badRequestCodes = new HashSet<string>
            {
                ApiExceptionCodes.BookingAssignAlreadyAssignedToAccount.Code,
                ApiExceptionCodes.BookingAssignAlreadyAssigned.Code,
                ApiExceptionCodes.BookingAssignInvalidEmail.Code,
            };
            if (badRequestCodes.Contains(ex.Code.Code))
            {
                throw new ApiException(ex, HttpStatusCode.BadRequest);
            }

            throw;
        }
    }

    /// <summary>
    /// Generate secure token based on request data which can be used to get booking
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("token")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [NoCacheControl]
#pragma warning disable S6968
    public IActionResult Token([FromBody] GetBookingRequest request)
#pragma warning restore S6968
    {
        var token = _bookingTokenService.GetBookingToken(request);
        return Ok(token);
    }

    /// <summary>
    /// Convert booking to credit
    /// </summary>
    /// <returns>Customer credit </returns>
    /// <response code="200">Booking details</response>
    /// <response code="400">Bad request: no booking details</response>
    /// <response code="503">Internal server error</response>
    [HttpPost]
    [Route("credit")]
    [ProducesResponseType(typeof(Domain.Data.Vouchers.BookingRefundResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> ConvertToCredit([FromBody] ConvertBookingToCreditRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        await _authenticationService.CheckIfSignedInAccountIsLocked(true);

        try
        {
            if (request.Type == ConvertType.CREDIT && !_apiSettings.Vouchers.IsActive)
            {
                return BadRequest("Credit is disabled");
            }

            var credit = await _bookingCreditService.RefundBooking(request);
            return Ok(credit);
        }
        catch (ApiException ex)
        {
            if (ex.Code.Code == ApiExceptionCodes.BookingCreditForbidden.Code)
            {
                throw new ApiException(ex, HttpStatusCode.Forbidden);
            }

            throw;
        }
    }

    /// <summary>
    /// Wrap getBooking action in try catch to handle specific errors:
    /// - Frad
    /// </summary>
    /// <param name="getBooking">Function to get booking</param>
    /// <returns></returns>
    private async Task<BookingResponse> GetBooking(Func<Task<BookingResponse>> getBooking)
    {
        try
        {
            var booking = await getBooking();
            // Load hotel details from sitecore
            await _hotelsService.EnrichBookingResponse(booking);
            return booking;
        }
        catch (ApiException ex)
        {
            switch (ex)
            {
                case var _ when ex.Code.Code == ApiExceptionCodes.BookingFraudError.Code:
                case var _ when ex.Code.Code == ApiExceptionCodes.BookingCannotGetPrivacy.Code:
                case var _ when ex.Code.Code == ApiExceptionCodes.BookingCannotHasContradictorySpecialRequest.Code:
                    throw;
                default:
                    throw new ApiException(ApiExceptionCodes.BookingViewError, "Can not find a booking", ex.InnerErrors, ex.InnerException, HttpStatusCode.BadRequest);
            }
        }
    }

    /// <summary>
    /// Wrap getBookingStatus action in try catch to handle specific errors:
    /// - Fraud
    /// </summary>
    /// <param name="getBookingStatus">Function to get booking status</param>
    /// <returns>booking status</returns>
    private static async Task<string> GetBookingStatus(Func<Task<string>> getBookingStatus)
    {
        try
        {
            return await getBookingStatus();
        }
        catch (ApiException ex)
        {
            if (ex.Code.Code == ApiExceptionCodes.BookingFraudError.Code)
            {
                throw;
            }
            throw new ApiException(ApiExceptionCodes.BookingViewError, "Can not find a booking", ex.InnerErrors,
                ex.InnerException, HttpStatusCode.BadRequest);
        }
    }

    /// <summary>
    /// Change booking privacy
    /// </summary>
    /// <param name="request"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("make-private")]
    [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> ChangeBookingPrivacy([FromBody] PrivacyBookingRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var booking = await GetBooking(() => _bookingService.Get(request));
        var memos = await _bookingChangeService.ChangeBookingPrivacy(booking, request.IsPrivate);
        booking.Memo = memos;
        booking.IsPrivate = _bookingService.BookingIsPrivate(booking.Memo);
        return Ok(booking);
    }

    /// <summary>
    /// when seatmap was enabled on UI when booking process started and seats were selected, but was disabled by the time user got to payment screen
    /// </summary>
    /// <exception cref="ApiException"></exception>
    private async Task ThrowIfSeatsSelectedAndSeatMapFlowDisabled(BookingRequest request)
    {
        if (request.SeatSelection != null && request.SeatSelection.Any(x => x.Seats != null && x.Seats.Count > 0))
        {
            var seatMapSettings = await _settingsService.GetSeatMapSettings();

            if (!seatMapSettings.EnableSeatMapFlow)
            {
                throw new ApiException(ApiExceptionCodes.BookingSeatSelectionDisabled,
                    ApiExceptionCodes.BookingSeatSelectionDisabled.Description, null, null, HttpStatusCode.BadRequest);
            }
        }
    }

    private void RoundResponsePrices(ValidateBookingRequest request, ValidateBookingResponse response)
    {
        if (request.NoRoundingPrice)
            return;

        _priceService.RoundPrice(response.PaymentInfo);

        foreach (var item in response.PriceBreakdown.EmptyIfNull())
            _priceService.RoundPrice(item);
    }

    [ExcludeFromCodeCoverage]
    private async Task RecordPaymentAndPriceMetrics(BookingRequest request, bool isTradeAgent, BookingResponse finalAtcomResponse)
    {
        _metricsService.IncrementCounter(MetricConstants.WebNewBookingTotal, 1,
            new KeyValuePair<string, object>("is_trade_agent", isTradeAgent),
            new KeyValuePair<string, object>("market_code", _marketService.GetCurrentMarket()?.Code),
            new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(request?.Offer?.Accom?.Code ?? MetricConstants.UnknownLabel))
        );
        
        await _otelAnalyticsService.TrackNewBookingAsync(request);
        
        // Track the total price of the booking
        _metricsService.ObserveHistogram(
            MetricConstants.WebTotalPriceHistogram,
            (double)(finalAtcomResponse?.PaymentInfo?.TotalPrice ?? 0),
            new KeyValuePair<string, object>("currency", finalAtcomResponse?.PaymentInfo?.Currency ?? MetricConstants.UnknownLabel),
            new KeyValuePair<string, object>("is_trade_agent", isTradeAgent),
            new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(request?.Offer?.Accom?.Code ?? MetricConstants.UnknownLabel))
        );

        // Track the actual amount paid
        _metricsService.ObserveHistogram(
            MetricConstants.WebPaymentAmountHistogram,
            (double)(request?.PaymentInfo?.Amount ?? 0),
            new KeyValuePair<string, object>("currency", finalAtcomResponse?.PaymentInfo?.Currency ?? MetricConstants.UnknownLabel),
            new KeyValuePair<string, object>("is_trade_agent", isTradeAgent),
            new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(request?.Offer?.Accom?.Code ?? MetricConstants.UnknownLabel))
        );
    }

    /// <summary>
    /// Tracks promo code validation metrics
    /// </summary>
    /// <param name="request">The validation request</param>
    /// <param name="isSuccess">Whether the validation was successful</param>
    /// <param name="errorCode">The API error code (only for failures)</param>
    [ExcludeFromCodeCoverage]
    private async Task TrackPromoCodeValidation(ValidateBookingRequest request, bool isSuccess, string errorCode)
    {
        // Determine error source based on error code
        string errorSource = null;
        if (!isSuccess && !string.IsNullOrEmpty(errorCode))
        {
            errorSource = DetermineErrorSource(errorCode);
        }

        // Track to Kafka analytics (both success and failure)
        await _otelAnalyticsService.TrackPromoCodeValidationAsync(request, isSuccess, errorSource);

        // Track to metrics counter
        var status = isSuccess ? MetricConstants.SuccessMetricStatus : MetricConstants.FailureMetricStatus;

        var tags = new List<KeyValuePair<string, object>>
        {
            new KeyValuePair<string, object>("status", status),
            new KeyValuePair<string, object>("promo_code", request?.DiscountCode ?? MetricConstants.UnknownLabel)
        };

        // Add error source for failures
        if (!isSuccess && !string.IsNullOrEmpty(errorSource))
        {
            tags.Add(new KeyValuePair<string, object>("error_source", errorSource));
        }

        _metricsService.IncrementCounter(MetricConstants.WebPromoCodeValidationTotal, 1, tags.ToArray());
    }

    /// <summary>
    /// Determines the source of the promo code validation error based on error code
    /// </summary>
    /// <param name="errorCode">The API error code (null for unknown errors)</param>
    /// <returns>Error source: SITECORE, VOUCHERIFY, ATCOM, or UNKNOWN</returns>
    [ExcludeFromCodeCoverage]
    private static string DetermineErrorSource(string errorCode)
    {
        // Unknown errors (non-ApiException)
        if (string.IsNullOrEmpty(errorCode))
        {
            return MetricConstants.Unknown;
        }
        
        return errorCode switch
        {
            // Sitecore CMS promotion validation
            _ when errorCode == ApiExceptionCodes.PromotionIsNotValid.Code => MetricConstants.Sitecore,
            
            // Voucherify service errors (only these 3)
            _ when errorCode == ApiExceptionCodes.VoucherInvalid.Code => MetricConstants.Voucherify,
            _ when errorCode == ApiExceptionCodes.VoucherNotFound.Code => MetricConstants.Voucherify,
            _ when errorCode == ApiExceptionCodes.VoucherExceeded.Code => MetricConstants.Voucherify,
            
            // All other errors are from ATCOM booking validation
            _ => MetricConstants.Atcom
        };
    }
}
