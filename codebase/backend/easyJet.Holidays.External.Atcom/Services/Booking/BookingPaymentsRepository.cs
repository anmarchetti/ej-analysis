using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Exceptions;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Atcom.Services.Booking
{
    /// <summary>
    /// CRUD operations for booking
    /// </summary>
    public class BookingPaymentsRepository : IBookingPaymentsRepository
    {
        private readonly EndpointsProvider _atcomRequestBuilder;
        private readonly IApiService _apiService;
        private readonly AtcomRequestGenerator _atcomRequestGenerator;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AtcomSettings _atcomSettings;
        private readonly ApiSettings _apiSettings;
        private readonly IAuthenticationService _authenticationService;
        private readonly ILogger<BookingPaymentsRepository> _logger;
        private readonly RequestBookingMapper _requestBookingMapper;
        private readonly IBookingPaymentsMapper _bookingPaymentsMapper;

        private Uri BookingRequest
        {
            get
            {
                return _atcomRequestBuilder.GetEndpoint(AtcomEndpoint.Booking, _httpContextAccessor.HttpContext?.Request?.Cookies);
            }
        }

        public BookingPaymentsRepository(
            IApiService apiService,
            EndpointsProvider atcomRequestBuilder,
            AtcomRequestGenerator atcomRequestGenerator,
            IHttpContextAccessor httpContextAccessor,
            IOptions<AtcomSettings> atcomSettings,
            IOptions<ApiSettings> apiSettings,
            IAuthenticationService authenticationService,
            ILogger<BookingPaymentsRepository> logger,
            RequestBookingMapper requestBookingMapper,
            IBookingPaymentsMapper bookingPaymentsMapper
            )
        {
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _logger = logger;
            _authenticationService = authenticationService;
            _apiService = apiService;
            _atcomRequestBuilder = atcomRequestBuilder;
            _atcomRequestGenerator = atcomRequestGenerator;
            _httpContextAccessor = httpContextAccessor;
            _requestBookingMapper = requestBookingMapper;
            _bookingPaymentsMapper = bookingPaymentsMapper;
        }


        /// <inheritdoc />
        public Task<BookingResponse> AddCreditPaymentInfo(
            PaymentInfo paymentInfo,
            LeadPassenger leadPassenger,
            MakePaymentResponse paymentResponse,
            string bookingReference,
            string bookingMarket,
            string bookingLanguage,
            string sessionId,
            string requestId,
            IList<string> promotionCollections = null)
        {
            return AddPaymentInfo(
                bookingReference,
                bookingMarket,
                bookingLanguage,
                leadPassenger,
                sessionId,
                requestId,
                promotionCollections,
                statelessRequest => _bookingPaymentsMapper.MapModifyCustPaymentRequest(
                    paymentInfo,
                    leadPassenger,
                    paymentResponse,
                    statelessRequest,
                    bookingReference,
                    _atcomSettings.Payment.AuthSys,
                    _atcomSettings.OfflinePaymentProcess)
                );
        }

        /// <inheritdoc />
        public Task<BookingResponse> AddCreditPaymentInfo(
            string bookingReference,
            string bookingMarket,
            string bookingLanguage,
            PaymentHistoryItem paymentItem,
            string refundAgainstId,
            string paymentId,
            LeadPassenger leadPassenger,
            string sessionId,
            string requestId,
            IList<string> promotionCollections = null)
        {
            return AddPaymentInfo(
                bookingReference,
                bookingMarket,
                bookingLanguage,
                leadPassenger,
                sessionId,
                requestId,
                promotionCollections,
                statelessRequest => _bookingPaymentsMapper.MapModifyCustPaymentRequest(
                    bookingReference,
                    paymentItem,
                    refundAgainstId,
                    paymentId,
                    statelessRequest)
                );
        }

        /// <inheritdoc />
        public Task<BookingResponse> AddCreditPaymentInfo(string reasonCode, decimal amount, LeadPassenger leadPassenger,
            string bookingReference, string bookingMarket, string bookingLanguage, string voucherId, string sessionId = null, string requestId = null, IList<string> promotionCollections = null)
        {
            var paymentConfig = PaymentConfigByReasonCode(reasonCode);
            _logger.LogInformation("Adding payment details for {ReasonCode}, {Amount}: {IssuedCode}, {RedeemedCode}", reasonCode, amount, paymentConfig.Issued.Code, paymentConfig.Redeemed.Code);

            return AddPaymentInfo(
                bookingReference,
                bookingMarket,
                bookingLanguage,
                leadPassenger,
                sessionId,
                requestId,
                promotionCollections,
                statelessRequest => _bookingPaymentsMapper.MapCreditModifyCustPaymentRequest(
                    amount,
                    bookingReference,
                    amount >= 0 ? paymentConfig.Redeemed : paymentConfig.Issued, // positive money means payment"="redeemed", negative means refund="issued"
                    statelessRequest,
                    voucherId)
                );
        }

        /// <summary>
        /// Add payment information to booking
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="bookingMarket">Booking market</param>
        /// <param name="bookingLanguage">Booking language</param>
        /// <param name="leadPassenger">Lead passenger details</param>
        /// <param name="sessionId">Booking session </param>
        /// <param name="requestId">Booking request id</param>
        /// <param name="promotionCollections"></param>
        /// <param name="bookingWithPaymentRequest">Func to map request</param>
        /// <returns></returns>        
        private async Task<BookingResponse> AddPaymentInfo(
            string bookingReference,
            string bookingMarket,
            string bookingLanguage,
            LeadPassenger leadPassenger,
            string sessionId,
            string requestId,
            IList<string> promotionCollections,
            Func<Models.Booking.BookingRequest, Models.Booking.BookingWithPaymentRequest> bookingWithPaymentRequest
            )
        {
            try
            {
                var cltInfo = _atcomRequestGenerator.BuildCltInfo(bookingMarket, bookingLanguage, true, promotionCollections);

                string customerId = await _authenticationService.MappedCustomerId();

                // build stateless request
                var statelessRequest = RequestBookingMapper.MapCreateWithoutPayment(leadPassenger, cltInfo, sessionId, requestId, customerId, LanguageParseUtils.MapToAtcomLang(bookingLanguage));

                // add payment data + stateless booking ID
                var bookingRequest = bookingWithPaymentRequest(statelessRequest);
                bookingRequest.Endpoint = BookingRequest;

                var errorsToIgnore = _atcomSettings.ErrorsToIgnoreInModifyCustPaymentResponse;

                bookingRequest.ValidateResponse = (response) =>
                {
                    if (!response.HasErrors() ||
                        (errorsToIgnore is not null && response.ApiErrors.All(x => errorsToIgnore.Any(y => y.Code == x.Code && x.Message == y.Message))))
                    {
                        return;
                    }

                    throw new ErrorResponseException(response, "Response has errors", response.ApiErrors, null);
                };

                var response = await _apiService.GetResponseContentAsyncWithCustomErrorMapping<Models.Booking.BookingWithPaymentRequest, Models.Booking.BookingWithPaymentResponse>(
                    bookingRequest, ApiExceptionCodes.BookingCommitError);

                // Map from Atcom to US
                // for MVP we are ignoring any amendments and it's always ViewOnly
                return await _requestBookingMapper.MapResponse(response.Payload.Body, null, null);
            }
            catch (ApiException ex)
            {
                throw new CommitBookingException("failed to commit booking", bookingReference, ex.InnerErrors, sessionId, requestId, ex);
            }
        }

        private PaymentCodesSettings PaymentConfigByReasonCode(string reasonCode)
        {
            // Gift cards can have different reason codes, but payment config is configured for just one "giftcard" value
            var isGiftCard = _apiSettings.Vouchers.GiftCards.Types.Contains(reasonCode, StringComparer.OrdinalIgnoreCase);
            if (isGiftCard)
            {
                reasonCode = _apiSettings.Vouchers.Types.GiftCard;
            }

            var paymentSettings = _atcomSettings.PaymentCodes.Values;

            var config = paymentSettings.FirstOrDefault(x => x.Reason.Equals(reasonCode, StringComparison.OrdinalIgnoreCase));

            // use default if we can't detect it by code
            if (config == null)
            {
                _logger.LogWarning("Can not find payment settings for {ReasonCode}, using default", reasonCode);
                config = paymentSettings.FirstOrDefault(x => x.IsDefault);
            }

            return config;
        }
    }
}
