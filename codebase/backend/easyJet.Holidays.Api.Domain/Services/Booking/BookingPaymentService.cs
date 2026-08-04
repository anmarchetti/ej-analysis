using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Payment;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class BookingPaymentService : IBookingPaymentService
    {
        private readonly IPaymentsService _paymentsService;
        private readonly IVoucherPaymentFlowService _voucherPaymentService;
        private readonly IBookingPaymentsRepository _bookingPaymentsRepository;
        private readonly ILogger<BookingPaymentService> _logger;
        private readonly ApiSettings _apiSettings;
        private readonly IMarketService _marketService;

        public BookingPaymentService(IPaymentsService paymentsService,
            IVoucherPaymentFlowService voucherPaymentService,
            IBookingPaymentsRepository bookingPaymentsRepository,
            ILogger<BookingPaymentService> logger,
            IOptions<ApiSettings> apiSettings,
            IMarketService marketService)
        {
            _paymentsService = paymentsService;
            _voucherPaymentService = voucherPaymentService;
            _bookingPaymentsRepository = bookingPaymentsRepository;
            _logger = logger;
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _marketService = marketService;
        }

        /// <summary>
        /// Process payment
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <param name="validateResponse"></param>
        /// <param name="commitBooking"></param>
        /// <returns></returns>
        public async Task<BookingResponse> ProcessPayment(
            BookingRequest bookingRequest,
            ValidateBookingResponse validateResponse,
            Func<Task<BookingResponse>> commitBooking)
        {
            var spendVoucherResults = new List<CreditSpend>();
            MakePaymentResponse paymentResult = null;

            try
            {
                bool processCardPayment = bookingRequest?.PaymentInfo?.Amount > 0;
                bool processVoucherPayment = bookingRequest?.PaymentInfo?.CreditAmount > 0 &&
                                             this._apiSettings.Vouchers?.IsActive == true;

                if (processCardPayment)
                {
                    paymentResult = await ProcessCardPayment(bookingRequest, validateResponse);
                }

                if (processVoucherPayment)
                {
                    // Redeem customer credits
                    spendVoucherResults = await _voucherPaymentService.Redeem(bookingRequest.PaymentInfo.CreditAmount, validateResponse.PaymentInfo.Currency, bookingRequest.BookingReference, validateResponse?.Accom?.Code, validateResponse?.MarketCode);
                }

                var finalBookingResponse = await commitBooking();
                var language = finalBookingResponse.Language;
                var marketCode = finalBookingResponse.MarketCode;

                if (processCardPayment)
                {

                    // Error at this stage will result in a booking with no payment, The Tour Operator will need to have their own processes for handling this
                    // If booking failure, cancel the payment in the external Payment Gateway
                    await _bookingPaymentsRepository.AddCreditPaymentInfo(bookingRequest.PaymentInfo,
                        bookingRequest.LeadPassenger, paymentResult, paymentResult!.BookingReference, marketCode, language,
                        paymentResult.SessionId, paymentResult.RequestId);
                }

                if (processVoucherPayment)
                {
                    // Add credit payment
                    await _voucherPaymentService.AddPaymentInfo(spendVoucherResults,
                    bookingRequest.LeadPassenger, validateResponse.BookingReference, marketCode, language, validateResponse.SessionId,
                    validateResponse.RequestId);
                }

                return finalBookingResponse;
            }
            catch (Exception ex)
            {
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
                            var error = await CatchBookingCommitException(
                                ex,
                                bookingRequest.BookingReference,
                                paymentResult?.PaymentId,
                                bookingRequest.LeadPassenger.Email,
                                spendVoucherResults);
                            throw error;
                        }
                }
            }
        }

        /// <summary>
        /// Process card payment
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <param name="validateResponse"></param>
        /// <returns></returns>
        private async Task<MakePaymentResponse> ProcessCardPayment(BookingRequest bookingRequest, ValidateBookingResponse validateResponse)
        {
            var bookingReference = validateResponse.BookingReference;
            var sessionId = validateResponse.SessionId;
            var requestId = validateResponse.RequestId;
            var market = _marketService.GetMarket(validateResponse.MarketCode);

            // Call to external Payment Gateway to confirm the payment, this request will be able to include the ATCOMRES booking reference from the BookingResponse
            // initialAtcomResponse.BookingReference, request.PaymentInfo
            var paymentResult = await _paymentsService.MakePayment(validateResponse.Accom, validateResponse.PaymentInfo, bookingRequest, bookingReference, sessionId, market);

            paymentResult.BookingReference = bookingReference;
            paymentResult.SessionId = sessionId;
            paymentResult.RequestId = requestId;

            if (paymentResult.ResultCode == PaymentResultCode.IDENTIFY || paymentResult.ResultCode == PaymentResultCode.CHALLENGE || paymentResult.ResultCode == PaymentResultCode.REDIRECT)
            {
                throw new PaymentAuthorisationRequiredException(paymentResult);
            }

            return paymentResult;
        }

        /// <summary>
        /// Handle payment gateway exception
        /// </summary>
        /// <param name="payEx"></param>
        /// <param name="spendVoucherResults"></param>
        /// <returns></returns>
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

        /// <summary>
        /// Handle booking commit exception
        /// </summary>
        /// <param name="originalException"></param>
        /// <param name="bookigReference"></param>
        /// <param name="paymentId"></param>
        /// <param name="leadPax"></param>
        /// <param name="spendVoucherResults"></param>
        /// <returns></returns>
        private async Task<ApiException> CatchBookingCommitException(Exception originalException, string bookigReference, string paymentId, string leadPax, List<CreditSpend> spendVoucherResults)
        {
            _logger.LogError(originalException, "Failed to commit booking");

            PaymentCancellationException paymentCancelException = null;
            ApiException redemptionException = null;

            if (originalException is ApiException && (originalException as ApiException).Code.Code == ApiExceptionCodes.BookingCommitError.Code)
            {
                paymentCancelException = await HandleCancelPaymentException(bookigReference, paymentId, leadPax);
                redemptionException = await _voucherPaymentService.Rollback(spendVoucherResults);
            }

            ApiError[] emptyErrors = new ApiError[0];

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

                if (origApiExcCode == ApiExceptionCodes.BookingValidatePriceError.Code)
                {
                    //Validate pricing error error
                    exceptionCode = ApiExceptionCodes.BookingValidatePriceError;
                }
            }

            // then throw api exception
            return new ApiException(exceptionCode, "Failed to commit booking", apiErrors.ToArray(), originalException);
        }

        /// <summary>
        /// Handle cancel payment exception
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
                await _paymentsService.CancelPayment(bookingReference, paymentId, leadPaxEmail);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to cancel payment after commit failure");
                ex = e as PaymentCancellationException;
            }

            return ex;
        }
    }
}