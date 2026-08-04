using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Promotions;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using System.Runtime.CompilerServices;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using ApiException = easyJet.Holidays.Api.Common.Exceptions.ApiException;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests")]
namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <inheritdoc />
    public class BookingCreateService : IBookingCreateService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IBookingPaymentsRepository _bookingPaymentsRepository;
        private readonly IBookingFetchService _bookingFetchService;
        private readonly IPaymentsService _paymentsService;
        private readonly AtcomSettings _atcomSettings;
        private readonly ApiSettings _apiSettings;
        private readonly VoucherSettings _voucherSettings;
        private readonly IVouchersService _vouchersService;
        private readonly IPromotionValidatorService _promotionValidatorService;
        private readonly ITransferService _transferService;
        private readonly ILogger<BookingCreateService> _logger;
        private readonly IVoucherPaymentFlowService _voucherPaymentService;
        private readonly IBookingSpecialRequestService _bookingSpecialRequestService;
        private readonly IReferenceDataService _referenceDataService;
        private readonly IBookingSessionService _bookingSessionService;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly HeadersSettings _headersSettings;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IAuthenticationService _authenticationService;
        private readonly IOfferPriceService _offerPriceService;
        private readonly ILanguageService _languageService;
        private readonly IMarketService _marketService;

        /// <summary>
        /// Precision for prices comparison
        /// </summary>
        private const decimal BookingPricePrecision = 0.0001m;

        /// <summary>
        /// Constructor to init dependencies
        /// </summary>
        public BookingCreateService(
            IPaymentsService paymentsService,
            IOptions<AtcomSettings> atcomSettings,
            IOptions<ApiSettings> apiSettings,
            ILogger<BookingCreateService> logger,
            IBookingRepository bookingRepository,
            IBookingPaymentsRepository bookingPaymentsRepository,
            IBookingFetchService bookingFetchService,
            IVouchersService vouchersService,
            ITransferService transferService,
            IPromotionValidatorService promotionValidatorService,
            IVoucherPaymentFlowService voucherPaymentService,
            IBookingSpecialRequestService bookingSpecialRequestService,
            IReferenceDataService referenceDataService,
            IBookingSessionService bookingSessionService,
            IHttpContextAccessor contextAccessor,
            IOptions<HeadersSettings> headersSettings,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IAuthenticationService authenticationService,
            IOfferPriceService offerPriceService,
            ILanguageService languageService,
            IMarketService marketService)
        {
            _bookingRepository = bookingRepository;
            _bookingPaymentsRepository = bookingPaymentsRepository;
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _voucherSettings = apiSettings?.Value?.Vouchers ?? throw new ArgumentNullException(nameof(_voucherSettings));
            _logger = logger;
            _paymentsService = paymentsService;
            _vouchersService = vouchersService;
            _transferService = transferService;
            _promotionValidatorService = promotionValidatorService;
            _bookingFetchService = bookingFetchService;
            _voucherPaymentService = voucherPaymentService;
            _bookingSpecialRequestService = bookingSpecialRequestService;
            _referenceDataService = referenceDataService;
            _bookingSessionService = bookingSessionService;
            _contextAccessor = contextAccessor;
            _authenticationService = authenticationService;
            _offerPriceService = offerPriceService;
            _headersSettings = headersSettings.Value ?? throw new ArgumentNullException(nameof(_headersSettings));
            _tradeAgentAuthService = tradeAgentAuthService;
            _languageService = languageService;
            _marketService = marketService;
        }

        /// <inheritdoc />
        public async Task<ValidateBookingResponse> Validate(ValidateBookingRequest request, bool stateful, BookingRequest bookingRequest = null, bool silenceTransferError = false, bool skipPriceJumpValidation = false)
        {
            ValidatePackageDate(request.Offer.Accom.Date);

            var originalCode = request.DiscountCode;

            try
            {
                if (IsDiscountCodeUsed(request.DiscountCode))
                {
                    return await ValidatePromoCodeRequest(request, stateful, bookingRequest, silenceTransferError);
                }

                var response = await _bookingRepository.Validate(request, stateful, bookingRequest, silenceTransferError);
                
                // populate data for possible promotion campaign
                response = await _promotionValidatorService.ExtendValidatePackageWithPromotions(response, request);
                return response;
            }
            catch (ApiException ex)
            {
                ThrowValidateException(originalCode, request.DiscountCode, ex);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<BookingResponse> Create(BookingRequest request)
        {
            ValidatePackageDate(request.Offer.Accom.Date);
            await ValidateSpecialRequest(request.SpecialRequests);

            return await CreateBooking(request, PriceValidationAction(request));
        }

        internal Action<ValidateBookingResponse> PriceValidationAction(BookingRequest request)
        {
            return validateResponse =>
            {
                var validatedPriceInfo = validateResponse.PaymentInfo;
                
                var offerPrice = IsDiscountCodeUsed(request.DiscountCode) ? 
                    request.OfferPriceWithDiscountApplied ?? request.Offer.Price : 
                    request.Offer.Price;
                var doesValidatedPriceMatchOfferPrice = Math.Abs(offerPrice - validatedPriceInfo.TotalPrice) < BookingPricePrecision;

                PriceJump();

                // flow for b2c customers
                if (!(_tradeAgentAuthService?.IsLoggedInAsTradeAgent() ?? false))
                {
                    var deposit = BookingUtils.BookingDeposit(validateResponse, _voucherSettings.DefaultDepositPerPerson);

                    var paymentAmount = request.PaymentInfo.Amount + (_apiSettings.Vouchers?.IsActive == true ? request.PaymentInfo.CreditAmount : 0);
                    var isTotalPriceValid = Math.Abs(paymentAmount - validatedPriceInfo.TotalPrice) < BookingPricePrecision;
                    var isDepositValid = Math.Abs(paymentAmount - deposit) < BookingPricePrecision;

                    if (!isTotalPriceValid && !isDepositValid)
                    {
                        _logger.LogError("Price is not valid. Expected:{TotalPrice} or {DepositPrice}, but got: {TotalPayment}", validatedPriceInfo.TotalPrice, validatedPriceInfo.DepositPrice, paymentAmount);
                        throw new ApiException(ApiExceptionCodes.BookingValidatePriceError, "Price is not valid", null, null);
                    }

                }
                else // flow for booking by agent
                {
                    request.PaymentInfo = new CardPaymentInfo()
                    {
                        Amount = 0,
                        CreditAmount = 0,
                    };
                }

                void PriceJump()
                {
                    if (!doesValidatedPriceMatchOfferPrice)
                    {
                        _logger.LogError("Price has changed. Expected:{OfferTotalPrice}, but got: {ValidatedPriceInfoTotalPayment}", request.Offer.Price, validatedPriceInfo.TotalPrice);
                        var error = new ApiError { Code = ApiExceptionCodes.BookingPriceJumpError.Code, Message = $"{validatedPriceInfo.TotalPrice}" };
                        throw new ApiException(ApiExceptionCodes.BookingPriceJumpError, [error], "Price has changed");
                    }
                }
            };
        }

        private async Task<ValidateBookingResponse> ValidatePromoCodeRequest(ValidateBookingRequest request, bool stateful, BookingRequest bookingRequest = null, bool silenceTransferError = false)
        {
            var validateResponseWithoutDiscount = await GetValidateResponseWithoutDiscount(request, null);

            request.Offer.Price = await _offerPriceService.GetOfferPrice(validateResponseWithoutDiscount);
            request.Offer.PricePP = await _offerPriceService.GetOfferPricePerPerson(validateResponseWithoutDiscount);

            // set the same values to price w/o TT because they received without tourist taxes applied from the validation service
            request.Offer.PriceExcludingTouristTax = request.Offer.Price;
            request.Offer.PricePPExcludingTouristTax = request.Offer.PricePP;

            var discountValidation = await ValidateDiscountCode(request);
            request.DiscountCode = discountValidation.AtcomDiscountCode;

            return await _bookingRepository.Validate(request, stateful, bookingRequest, silenceTransferError);
        }

        /// <inheritdoc />
        private async Task<BookingResponse> CreateBooking(BookingRequest request, Action<ValidateBookingResponse> validatePrice)
        {
            if (request.PaymentInfo == null)
            {
                throw new ArgumentNullException(nameof(request.PaymentInfo));
            }

            string bookingReference = request.BookingReference;
            string paymentId = null;
            var spendVoucherResults = new List<CreditSpend>();
            ApiError[] emptyErrors = new ApiError[0];
            MakePaymentResponse paymentResult = null;
            bool processCardPayment = request?.PaymentInfo?.Amount > 0;
            bool processVoucherPayment = request?.PaymentInfo?.CreditAmount > 0 && _apiSettings.Vouchers?.IsActive == true;
            BookingResponse finalBookingResponse = null;

            string discountRedemptionId = null;
            string originalDiscountCode = null;

            try
            {
                string sessionId = request.SessionId;
                // Why do we need it?
                // Based on Atcom comment: "If your Stateful InfoBookingRequst contains an external flight, Atcom will create an Option booking"
                // We do DisplayBooking request instead of InfoBooking only if request has external flights
                var hasExternalFlight = HasExternalFlight(request);

                if (IsDiscountCodeUsed(request.DiscountCode))
                {
                    var validateRequest = ValidateBookingRequest.FromBookingRequest(request);
                    var validateResponseWithoutDiscount = await GetValidateResponseWithoutDiscount(validateRequest, request);

                    // Keep original price for price validation
                    request.OfferPriceWithDiscountApplied = request.Offer.Price;
                    
                    request.Offer.Price = await _offerPriceService.GetOfferPrice(validateResponseWithoutDiscount);
                    request.Offer.PricePP = await _offerPriceService.GetOfferPricePerPerson(validateResponseWithoutDiscount);
                    
                    // set the same values to price w/o TT because they received without tourist taxes applied from the validation service
                    request.Offer.PriceExcludingTouristTax = request.Offer.Price;
                    request.Offer.PricePPExcludingTouristTax = request.Offer.PricePP;
                    
                    var discountValidation = await ValidateDiscountCode(validateRequest);

                    request.DiscountCode = discountValidation.AtcomDiscountCode;
                    originalDiscountCode = discountValidation.VoucherCode;
                }

                string requestId = null;
                var validateBookingRequest = ValidateBookingRequest.FromBookingRequest(request);
                ValidateBookingResponse validateResponse;

                var isNewSession = string.IsNullOrEmpty(bookingReference);
                var ejhSessionKey = await GetOrGenerateEJHSessionKey(bookingReference);
                _contextAccessor.HttpContext.Items[_headersSettings.EJSessionHeader] = ejhSessionKey;
                _logger.LogInformation("Atcom booking session ID: {SessionId}, is new session: {IsNew}", ejhSessionKey, isNewSession);

                // if there is no server transaction ID - this is a first payment call
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    // InfoBookingRequest – stateful
                    validateResponse = await _bookingRepository.Validate(validateBookingRequest, true, request);
                    sessionId = validateResponse.SessionId;
                    requestId = validateResponse.RequestId;
                    bookingReference = validateResponse.BookingReference;
                }
                else
                {
                    if (hasExternalFlight)
                    {
                        // Check visibility for transfers
                        (await _transferService.BuildTransfers(request.Offer))?.ToList();
                        validateResponse = await ValidateBookingWithExternalFlights(request);
                        _logger.LogInformation("Validating price for 2nd step for external flights: ref: {BookingReference}, price: {TotalPrice}", request.BookingReference, validateResponse.PaymentInfo.TotalPrice);
                    }
                    else
                    {
                        // We can't do DisplayBooking before it's created/modified (from Atcom)                    
                        validateResponse = await _bookingRepository.Validate(validateBookingRequest, false, null);
                    }
                }

                var currentCurrency = validateResponse.Currency.Code;
                var bookingMarketCode = validateResponse.MarketCode;
                var market = _marketService.GetMarket(bookingMarketCode);
                var bookingLanguage = _languageService.GetCurrentLanguage();

                //only in case of new ej session we should create it in dynamoDB
                if (isNewSession)
                {
                    await _bookingSessionService.CreateBookingSession(new Data.DynamoDB.Bookings.BookingSession()
                    {
                        BookingRef = bookingReference,
                        SessionId = ejhSessionKey,
                    });
                }

                //Validate Create Special Requests
                if (!string.IsNullOrEmpty(request.SpecialRequests))
                {
                    await _bookingSpecialRequestService.EnsureCreateSpecialRequests(validateResponse.Accom);
                }

                // for every call (for 3DS case), we have to redeem the discount, and then rollback to support abandoned 3DS scenario
                if (!string.IsNullOrWhiteSpace(originalDiscountCode))
                {
                    //promo(discount) code
                    discountRedemptionId = await _vouchersService.UseDiscountVoucher(originalDiscountCode, bookingReference);
                }

                // Validate payment amount
                validatePrice(validateResponse);

                if (processCardPayment)
                {
                    // Call to external Payment Gateway to confirm the payment, this request will be able to include the ATCOMRES booking reference from the BookingResponse
                    // initialAtcomResponse.BookingReference, request.PaymentInfo
                    paymentResult = await _paymentsService.MakePayment(validateResponse.Accom, validateResponse.PaymentInfo, request, bookingReference, sessionId, market);

                    paymentId = paymentResult.PaymentId;

                    paymentResult.BookingReference = bookingReference;
                    paymentResult.SessionId = sessionId;
                    paymentResult.RequestId = requestId;

                    if (paymentResult.ResultCode == PaymentResultCode.IDENTIFY || paymentResult.ResultCode == PaymentResultCode.CHALLENGE || paymentResult.ResultCode == PaymentResultCode.REDIRECT)
                    {
                        throw new PaymentAuthorisationRequiredException(paymentResult);
                    }
                }

                if (processVoucherPayment)
                {
                    // Redeem customer credits
                    spendVoucherResults = await _voucherPaymentService.Redeem(request.PaymentInfo.CreditAmount, currentCurrency, bookingReference, validateResponse?.Accom?.Code, bookingMarketCode);
                }

                // BookingRequest – no payment information, makes the ATCOMRES booking. If booking failure, cancel the payment in the external Payment Gateway, so no payment will have been taken
                finalBookingResponse = await _bookingRepository.StartBooking(request, bookingReference, sessionId, requestId);

                if (!string.IsNullOrEmpty(request.SpecialRequests))
                {
                    finalBookingResponse = await _bookingSpecialRequestService.AddSpecialRequestsToBooking(request.SpecialRequests, finalBookingResponse, sessionId, requestId);
                }

                if (processCardPayment)
                {
                    // Error at this stage will result in a booking with no payment, The Tour Operator will need to have their own processes for handling this
                    // If booking failure, cancel the payment in the external Payment Gateway
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(request.PaymentInfo, request.LeadPassenger, paymentResult, bookingReference, bookingMarketCode, bookingLanguage, sessionId, requestId, request.Offer.PromotionCollections);
                }
                if (processVoucherPayment)
                {
                    // Add credit payment
                    await _voucherPaymentService.AddPaymentInfo(spendVoucherResults, request.LeadPassenger, bookingReference, bookingMarketCode, bookingLanguage, sessionId, requestId, request.Offer.PromotionCollections);
                }

                _logger.LogInformation("Booking was created successfully: {BookingReference}", finalBookingResponse.BookingReference);

                // we are returning initial response, because second one doesn't not have any passenger information
                return finalBookingResponse;
            }
            catch (Exception ex)
            {
                // we are rolling back discount redemption if something has failed.
                // 3DS is a special case - we have to use and rollback code on every step to support case, when user abandons 3DS flow
                try
                {
                    if (!string.IsNullOrWhiteSpace(discountRedemptionId))
                    {
                        await _vouchersService.RollBackDiscountRedemptions(originalDiscountCode, new[] { discountRedemptionId }, "Failed to commit booking");
                    }
                }
                catch (Exception discountRollbackEx)
                {
                    _logger.LogError(discountRollbackEx, "Failed to rollback discount code:{OriginalDiscountCode} redemption with ID {DiscountRedemptionId}", originalDiscountCode, discountRedemptionId);
                }

                switch (ex)
                {
                    case PaymentAuthorisationRequiredException _:
                        throw;
                    case PaymentGatewayException exception:
                        {
                            var payApiError = await CatchPaymentGatewayException(exception, spendVoucherResults);
                            throw payApiError;
                        }
                    default:
                        {
                            var error = await CatchBookingCommitException(ex, paymentResult, bookingReference, paymentId, request?.LeadPassenger?.Email, spendVoucherResults, async () =>
                            {
                                if (finalBookingResponse != null)
                                {
                                    return await HandleCancelBookingException(bookingReference, request.Offer.PromotionCollections);
                                }

                                return null;
                            });

                            throw error;
                        }
                }
            }
        }

        private async Task<string> GetOrGenerateEJHSessionKey(string bookingReference)
        {
            if (string.IsNullOrEmpty(bookingReference))
            {
                return Guid.NewGuid().ToString();
            }

            var session = await _bookingSessionService.GetBookingSession(bookingReference);

            // fallback in case dynamo TTL already removed the row?
            return session?.SessionId ?? Guid.NewGuid().ToString();
        }

        private async Task<ApiException> CatchPaymentGatewayException(PaymentGatewayException payEx, List<CreditSpend> spendVoucherResults)
        {
            ApiError[] emptyErrors = new ApiError[0];

            var fullErrors = payEx?.Errors;
            var additianalInfo = new Dictionary<string, string> { { "sessionId", payEx?.SessionId }, { "bookingReference", payEx?.BookingReference } };

            var redemptionException = await _voucherPaymentService.Rollback(spendVoucherResults);

            if (redemptionException != null)
            {
                fullErrors = (fullErrors ?? emptyErrors)
                    .Union(redemptionException?.InnerErrors ?? emptyErrors)
                    .ToArray();
            }
            fullErrors = fullErrors?.Select(e => new ApiError { Code = e.Code, Message = null }).ToArray();

            return new ApiException(ApiExceptionCodes.BookingPaymentError, "Failed to create a booking", fullErrors, payEx, null, additianalInfo);
        }

        private async Task<ApiException> CatchBookingCommitException(Exception originalException, MakePaymentResponse paymentResult, string bookingReference, string paymentId, string leadPaxEmail, List<CreditSpend> spendVoucherResults, Func<Task<ApiException>> additionalHandle)
        {
            _logger.LogError(originalException, "Failed to commit booking");

            ApiError[] emptyErrors = Array.Empty<ApiError>();

            PaymentCancellationException paymentCancelException = null;
            ApiException additionalHandlerException = null;
            // Handle multiple error types with the same logic.
            if (paymentResult != null)
            {
                paymentCancelException = await HandleCancelPaymentException(bookingReference, paymentId, leadPaxEmail);
            }

            var redemptionException = await _voucherPaymentService.Rollback(spendVoucherResults);

            if (additionalHandle != null)
            {
                additionalHandlerException = await additionalHandle();
            }

            IEnumerable<ApiError> apiErrors = new List<ApiError>();

            if (originalException is CommitBookingException)
            {
                apiErrors = apiErrors.Union((originalException as CommitBookingException)?.Errors ?? emptyErrors);
            }

            if (originalException is ApiException)
            {
                apiErrors = apiErrors.Union((originalException as ApiException)?.InnerErrors ?? emptyErrors);
            }

            apiErrors = apiErrors
                .Union(paymentCancelException?.Errors ?? emptyErrors)
                .Union(additionalHandlerException?.InnerErrors ?? emptyErrors)
                .Union(redemptionException?.InnerErrors ?? emptyErrors);


            var exceptionCode = ApiExceptionCodes.BookingCommitError;


            if (originalException is ApiException)
            {
                var origApiExcCode = (originalException as ApiException)?.Code.Code;
                if (origApiExcCode == ApiExceptionCodes.SearchPackagesError.Code)
                {
                    // EJH-8834 Use ApiExceptionCodes.SearchPackagesError to be clear that offer is not available, and not issue with payment/...
                    exceptionCode = ApiExceptionCodes.SearchPackagesError;
                }

                if (origApiExcCode == ApiExceptionCodes.BookingTransfersUnavailalbe.Code)
                {
                    // Transfer unavailalbe error with throw if book hoday less then in 24h
                    exceptionCode = ApiExceptionCodes.BookingTransfersUnavailalbe;
                }

                //Adding special requests error
                if (origApiExcCode == ApiExceptionCodes.SSRAddIsDisabled.Code)
                {
                    exceptionCode = ApiExceptionCodes.SSRAddIsDisabled;
                }

                //Adding special requests for HBG error
                if (origApiExcCode == ApiExceptionCodes.SSRAddNotAllowedForHBG.Code)
                {
                    exceptionCode = ApiExceptionCodes.SSRAddNotAllowedForHBG;
                }

                //Adding special requests for DC error
                if (origApiExcCode == ApiExceptionCodes.SSRAddNotAllowedForDC.Code)
                {
                    exceptionCode = ApiExceptionCodes.SSRAddNotAllowedForDC;
                }
            }

            // then throw api exception
            return new ApiException(exceptionCode, "Failed to commit booking", apiErrors.ToArray(), originalException);
        }

        /// <inheritdoc />
        public async Task<BookingResponse> PayRemainingBalance(PayRemainingBalanceRequest request)
        {
            if (request.PaymentInfo == null)
            {
                throw new ArgumentNullException(nameof(request.PaymentInfo));
            }

            if (request.BookingReference == null)
            {
                throw new ArgumentNullException(nameof(request.BookingReference));
            }

            MakePaymentResponse paymentResult = null;
            string bookingReference = request.BookingReference;
            string paymentId = null;
            string leadPaxEmail = null;
            var spendVoucherResults = new List<CreditSpend>();
            ApiError[] emptyErrors = new ApiError[0];
            bool processCardPayment = request?.PaymentInfo?.Amount > 0;
            bool processVoucherPayment = request?.PaymentInfo?.CreditAmount > 0 && _apiSettings.Vouchers?.IsActive == true;

            try
            {
                // WE use GetBooking which doesn't clear response to make sure we have original booking data
                var bookingResponse = await _bookingRepository.GetBooking(new GetBookingRequest
                {
                    BookingReference = request.BookingReference,
                    LastName = request.LastName,
                    Date = request.Date
                });

                if (request?.PaymentInfo != null)
                    request.PaymentInfo.Currency = bookingResponse.Currency.Code;

                var isLoggedInAsLeadPax = await _authenticationService.IsLoggedInAsLeadPax(bookingResponse.LeadPassenger.Email);
                bookingResponse.IsLoggedInAsLeadPassenger = isLoggedInAsLeadPax;

                if (processVoucherPayment && !isLoggedInAsLeadPax)
                {
                    throw new ApiException(ApiExceptionCodes.PaymentWithCreditsNonLeadPaxError, $"Payment by credits is not allowed for not lead pax of the booking.", null, null);
                }

                if (BookingUtils.CanPayOutstandingBalance(bookingResponse, _atcomSettings.AllowPayOutstandingBalanceIsGreaterThanDays))
                {
                    // throw error if enable to pay remaining balance for the booking
                    throw new ApiException(ApiExceptionCodes.BookingCannotPayOutstandingBalance, $"can not pay outstanding balance less then in {_atcomSettings.AllowPayOutstandingBalanceIsGreaterThanDays} days", null, null);
                }

                // There is no validation on Atcom side how much we pay
                var dueAmount = bookingResponse.PaymentInfo.BalanceDueAmount;
                if (request.PaymentInfo.Amount > dueAmount)
                {
                    _logger.LogError("Trying to pay more than necessary. Expected maximum: {DueAmount}", dueAmount);
                    throw new ApiException(ApiExceptionCodes.BookingValidatePriceError, "Price is not valid", null, null);
                }

                // Preparing payment request
                leadPaxEmail = bookingResponse.LeadPassenger?.Email;

                if (processCardPayment)
                {
                    var paymentDetailsRequest = new BookingRequest
                    {
                        BookingReference = request.BookingReference,
                        BrowserInfo = request.BrowserInfo,
                        PaymentInfo = request.PaymentInfo,

                        Guests = bookingResponse.Guests,
                        LeadPassenger = bookingResponse.LeadPassenger,
                        Offer = new Data.PackageOffers.Offer
                        {
                            Transport = bookingResponse.Package.Transport,
                        }
                    };

                    var market = _marketService.GetMarket(bookingResponse.MarketCode);
                    paymentResult = await _paymentsService.MakePayment(
                        bookingResponse.Package.Accom,
                        bookingResponse.PaymentInfo,
                        paymentDetailsRequest, bookingReference,
                        null,
                        market);
                    paymentId = paymentResult.PaymentId;

                    // Check if payment rerun error (it can be fine because of 3D secure)
                    paymentResult.BookingReference = bookingReference;
                    if (paymentResult.ResultCode == PaymentResultCode.IDENTIFY || paymentResult.ResultCode == PaymentResultCode.CHALLENGE || paymentResult.ResultCode == PaymentResultCode.REDIRECT)
                    {
                        throw new PaymentAuthorisationRequiredException(paymentResult);
                    }

                    // Update booking with payment information
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(request.PaymentInfo, bookingResponse.LeadPassenger, paymentResult, bookingReference, bookingResponse.MarketCode, bookingResponse.Language, null, null);
                }

                if (processVoucherPayment)
                {
                    spendVoucherResults = await _voucherPaymentService.Redeem(request.PaymentInfo.CreditAmount,
                        request.PaymentInfo.Currency, bookingReference, bookingResponse?.Package?.Accom?.Code, bookingResponse?.MarketCode, null,
                        new RedemptionMetadata()
                        {
                            Action = _voucherSettings.Action.Spend,
                            Source = _voucherSettings.Source.Web
                        });

                    // Add credit payment
                    await _voucherPaymentService.AddPaymentInfo(spendVoucherResults, bookingResponse.LeadPassenger, bookingReference, bookingResponse.MarketCode, bookingResponse.Language, null, null);
                }

                // Return updated booking.
                // Here we use Get because data will be returned back and we need to protect it
                bookingResponse = await _bookingFetchService.Get(new GetBookingRequest
                {
                    BookingReference = request.BookingReference,
                    LastName = request.LastName,
                    Date = request.Date
                });
                return bookingResponse;
            }
            catch (PaymentAuthorisationRequiredException ex)
            {
                // Do not handle PaymentAuthorisationRequiredException
                throw ex;
            }
            catch (PaymentGatewayException payEx)
            {
                var error = await CatchPaymentGatewayException(payEx, spendVoucherResults);
                throw error;
            }
            catch (Exception ex)
            {
                var error = await CatchBookingCommitException(ex, paymentResult, bookingReference, paymentId, leadPaxEmail, spendVoucherResults, null);
                throw error;
            }
        }

        /// <summary>
        /// Camcel booking
        /// </summary>
        /// <param name="bookingReference">Booking ref</param>
        /// <param name="promotionCollections"></param>
        private async Task<BookingCancellationException> HandleCancelBookingException(string bookingReference, IList<string> promotionCollections)
        {
            BookingCancellationException ex = null;
            try
            {
                // cancel initial booking 
                await _bookingRepository.CancelBooking(bookingReference, "Commit booking failed", true, promotionCollections);
            }
            catch (BookingCancellationException bcEx)
            {
                _logger.LogError(bcEx, "Failed to cancel booking after commit failure");
                ex = bcEx;
            }
            return ex;
        }

        /// <summary>
        /// Cancel payment
        /// </summary>
        /// <param name="bookingReference">booking ref</param>
        /// <param name="paymentId">payment ID</param>
        /// <param name="leadPaxEmail">lead passenger email</param>
        private async Task<PaymentCancellationException> HandleCancelPaymentException(string bookingReference, string paymentId, string leadPaxEmail)
        {
            PaymentCancellationException ex = null;
            // commit booking has failed - canceling payment
            try
            {
                // canceling payment
                var cancelPaymentResult = await _paymentsService.CancelPayment(bookingReference, paymentId, leadPaxEmail);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to cancel payment after commit failure");
                ex = e as PaymentCancellationException;
            }

            return ex;
        }

        /// <summary>
        /// Validate discount code and booking against Sitecore and Voucherify.
        /// </summary>
        /// <param name="request">Validate booking request</param>
        /// <returns></returns>
        private async Task<ValidateVoucher> ValidateDiscountCode(ValidateBookingRequest request)
        {
            //Validate discount code againt Sitecore.
            var validatePromotion = await _promotionValidatorService.Validate(request);

            string voucherCode = validatePromotion?.VoucherCode;

            if (string.IsNullOrWhiteSpace(voucherCode))
            {
                voucherCode = request.DiscountCode;
            }

            //Validate discount code againt Voucherify.
            var atcomDiscountCode = await _vouchersService.ExchangeDiscountToAtcomCode(voucherCode);

            return new ValidateVoucher()
            {
                VoucherCode = voucherCode,
                AtcomDiscountCode = atcomDiscountCode,
                VoucherType = VoucherType.PROMO_VOUCHER
            };
        }

        /// <summary>
        /// Get validate booking response without discounts
        /// </summary>
        /// <param name="validateRequest">Validate booking request</param>
        /// <param name="bookingRequest">Booking request</param>
        /// <returns>Validate booking response</returns>
        private async Task<ValidateBookingResponse> GetValidateResponseWithoutDiscount(ValidateBookingRequest validateRequest, BookingRequest bookingRequest)
        {
            var reqDiscountCode = validateRequest.DiscountCode;

            // We have to do validate to get package price without promo code
            validateRequest.DiscountCode = null;

            ValidateBookingResponse validateResponse;
            var hasExternalFlight = HasExternalFlight(bookingRequest);
            if (hasExternalFlight && !string.IsNullOrWhiteSpace(bookingRequest?.SessionId))
            {
                // external flights and 2nd request (should have booking reference). 
                validateResponse = await ValidateBookingWithExternalFlights(bookingRequest);

                // Option booking was created using discount code
                // We should compensate discount amount to have TotalPrice without it
                var discounts = validateResponse.PriceBreakdown.Where(x => x.Code == _atcomSettings.PromotionsCodeName).Sum(x => x.Amount);
                _logger.LogInformation("Getting package price for offer with ext flights, discounts: {Discounts}", discounts);

                var paymentInfo = validateResponse.PaymentInfo;
                var pp = paymentInfo.TotalPrice / paymentInfo.PricePP;
                paymentInfo.TotalPrice -= discounts;
                paymentInfo.PricePP = paymentInfo.TotalPrice / pp;
            }
            else
            {
                validateResponse = await _bookingRepository.Validate(validateRequest, false, null, false, true);
            }

            // Set original price
            validateRequest.DiscountCode = reqDiscountCode;
            return validateResponse;
        }

        /// <summary>
        /// Validate offer date based on app settings.
        /// It may be not allowed to book package for today and tomorrow.
        /// </summary>
        /// <param name="date">Offer start date</param>
        /// <returns>True for valid package</returns>
        private void ValidatePackageDate(DateTime? date)
        {
            if (!BookingUtils.IsPackageDateValid(date, _apiSettings.DisabledOffersForNextDay))
            {
                throw new ApiException(ApiExceptionCodes.SearchPackagesError, "Offer date is not valid", null, null, System.Net.HttpStatusCode.BadRequest);
            }
        }

        /// <summary>
        /// Validates the special request.
        /// </summary>
        /// <param name="codesStr">The codes string.</param>
        private async Task ValidateSpecialRequest(string codesStr)
        {
            if (string.IsNullOrEmpty(codesStr))
            {
                return;
            }

            var codes = codesStr.Split(',');
            await ValidateSpecialRequestCodes(codes);

            await ValidateSpecialRequestContradictionaryGroup(codes);
        }

        /// <summary>
        /// Validates the special request codes.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">At list one special request code is invalid</exception>
        private async Task ValidateSpecialRequestCodes(string[] codes)
        {
            List<SpecialRequestsGroup> specialRequestGroups = await _referenceDataService.GetSpecialRequestGroups();

            if (codes.Any(code => !specialRequestGroups.Exists(g => g.SpecialRequests.Exists(r => r.Code == code))))
            {
                _logger.LogError("At list one special request code is invalid");
                throw new ApiException(ApiExceptionCodes.BookingCannotAddSpecialRequest, "At list one special request code is invalid", null, null, System.Net.HttpStatusCode.BadRequest);
            }

            await _bookingSpecialRequestService.ValidateSpecialRequestCodes(codes);
            await _bookingSpecialRequestService.ValidateSpecialRequestContradictionaryGroup(codes);
        }

        /// <summary>
        /// Validates the special request contradictionary group.
        /// </summary>
        /// <param name="codes">The codes.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">Booking has more the one special request in {contradictoryGroup.Name}</exception>
        private async Task ValidateSpecialRequestContradictionaryGroup(string[] codes)
        {
            var specialRequestContradictoryGroups = await _referenceDataService.GetSpecialRequestContradictoryGroups();

            foreach (var contradictoryGroup in specialRequestContradictoryGroups)
            {
                var contradictoryRequestInGroup = contradictoryGroup.SpecialRequests.Where(x => codes.Contains(x.Code)).Count();
                if (contradictoryRequestInGroup > 1)
                {
                    _logger.LogError($"Booking has more the one special request in {contradictoryGroup.Name}");
                    throw new ApiException(ApiExceptionCodes.BookingCannotHasContradictorySpecialRequest, $"Booking has more the one special request in {contradictoryGroup.Name}", null, null, System.Net.HttpStatusCode.BadRequest);
                }
            }
        }

        /// <summary>
        /// Based on Atcom comment: "If your Stateful InfoBookingRequst contains an external flight, Atcom will create an Option booking"
        /// We do DisplayBooking request instead of InfoBooking only if request has external flights
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        private async Task<ValidateBookingResponse> ValidateBookingWithExternalFlights(BookingRequest request)
        {
            // Based on Atcom comment: "If your Stateful InfoBookingRequst contains an external flight, Atcom will create an Option booking"
            // We do DisplayBooking request instead of InfoBooking only if request has external flights
            var optionBooking = await _bookingRepository.GetBookingUnsafe(request.BookingReference);

            return new ValidateBookingResponse
            {
                Accom = optionBooking.Package.Accom,
                Guests = optionBooking.Guests,
                BookingReference = optionBooking.BookingReference,
                Memos = optionBooking.Memo,
                PaymentInfo = optionBooking.PaymentInfo,
                Currency = optionBooking.Currency,
                PriceBreakdown = optionBooking.PriceBreakdown,
                Transfers = optionBooking.Transfers,
                LateRoomCheckout = optionBooking.LateRoomCheckout,
                DiscountCode = optionBooking.Prom,
                ResultStatus = optionBooking.BookingStatus,
                MarketCode = optionBooking.MarketCode,
            };
        }

        private bool HasExternalFlight(BookingRequest request)
        {
            return request?.Offer?.Transport?.Routes?.Select(x => x.IsExternal)?.Any(x => x) ?? false;
        }

        private bool IsDiscountCodeUsed(string discountCode)
        {
            return !string.IsNullOrWhiteSpace(discountCode);
        }

        /// <summary>
        /// Sanitizes string in case Atcom returns true code in response.
        /// </summary>
        /// <param name="originalDiscountCode">Original discount code.</param>
        /// <param name="discountCode">Atcom discount code identifier.</param>
        /// <param name="exception">ApiException object.</param>
        internal static void ThrowValidateException(string originalDiscountCode, string discountCode, ApiException exception)
        {
            if (!string.IsNullOrWhiteSpace(originalDiscountCode) && exception.InnerErrors != null)
            {
                var maskedErrors = exception.InnerErrors.Select(e => new ApiError
                {
                    Code = e.Code,
                    Message = e.Message?
                                .Replace(discountCode ?? originalDiscountCode, originalDiscountCode, StringComparison.InvariantCultureIgnoreCase)
                                .Replace(".00", string.Empty, StringComparison.InvariantCultureIgnoreCase)
                                .Replace("\n", ", ", StringComparison.InvariantCultureIgnoreCase)
                                .Replace(" 00:00", string.Empty, StringComparison.InvariantCultureIgnoreCase)
                }).ToArray();

                throw new ApiException(exception.Code, maskedErrors, exception.InnerException);
            }
        }

    }
}
