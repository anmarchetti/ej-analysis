using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Payment;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Cms;
using easyJet.Holidays.Api.Domain.Interfaces.MemoService;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Luggage;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking
{
    /// <summary>
    /// Amend booking service
    /// </summary>
    public class AmendBookingService : IAmendBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IBookingPaymentService _bookingPaymentService;
        private readonly IAuthenticationService _authenticationService;
        private readonly ILogger<AmendBookingService> _logger;
        private readonly IAmendBookingRefundService _amendBookingRefundService;
        private readonly IAmendPassengerService _amendBookingPassengerService;
        private readonly IBookingSessionService _bookingSessionService;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly HeadersSettings _headersSettings;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IAmendPromocodeHandlerService _amendPromocodeHandlerService;
        private readonly IMemoService _memoService;
        private readonly ISettingsService _settingsService;
        private readonly IAmendmentChargesService _amendmentChargesService;
        private readonly ILuggageService _luggageService;
        private readonly IFlightExtraService _flightExtraService;

        /// <summary>
        /// Constructor for DI
        /// </summary>
        /// <param name="bookingRepository"></param>
        /// <param name="logger"></param>
        /// <param name="bookingPaymentService"></param>
        /// <param name="authenticationService"></param>
        /// <param name="amendBookingRefundService"></param>
        /// <param name="amendBookingPassengerService"></param>
        /// <param name="bookingSessionService"></param>
        /// <param name="contextAccessor"></param>
        /// <param name="headersSettings"></param>
        /// <param name="tradeAgentAuthService"></param>
        /// <param name="memoService"></param>
        /// <param name="amendPromocodeHandlerService"></param>
        /// <param name="settingsService"></param>
        /// <param name="amendmentChargesService"></param>
        /// <param name="luggageService"></param>
        /// <param name="flightExtraService"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public AmendBookingService(
            IBookingRepository bookingRepository,
            ILogger<AmendBookingService> logger,
            IBookingPaymentService bookingPaymentService,
            IAuthenticationService authenticationService,
            IAmendBookingRefundService amendBookingRefundService,
            IAmendPassengerService amendBookingPassengerService,
            IBookingSessionService bookingSessionService,
            IHttpContextAccessor contextAccessor,
            IOptions<HeadersSettings> headersSettings,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IMemoService memoService,
            IAmendPromocodeHandlerService amendPromocodeHandlerService,
            ISettingsService settingsService,
            IAmendmentChargesService amendmentChargesService,
            ILuggageService luggageService,
            IFlightExtraService flightExtraService)
        {
            _bookingRepository = bookingRepository;
            _logger = logger;
            _bookingPaymentService = bookingPaymentService;
            _authenticationService = authenticationService;
            _amendBookingRefundService = amendBookingRefundService;
            _amendBookingPassengerService = amendBookingPassengerService;
            _bookingSessionService = bookingSessionService;
            _contextAccessor = contextAccessor;
            _tradeAgentAuthService = tradeAgentAuthService;
            _headersSettings = headersSettings.Value ?? throw new ArgumentNullException(nameof(headersSettings));
            _memoService = memoService;
            _amendPromocodeHandlerService = amendPromocodeHandlerService;
            _settingsService = settingsService;
            _amendmentChargesService = amendmentChargesService;
            _luggageService = luggageService;
            _flightExtraService = flightExtraService;
        }

        /// <summary>
        /// Amend booking with price validation
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<BookingResponse> AmendBooking(AmendBookingRequest request)
        {
            ArgumentNullException.ThrowIfNull(request);
            var booking = await
                _bookingRepository.GetBookingUnsafe(request.BookingReference,
                        new GetBookingOptions() { MapRealExtraLuggageInfoForInternalFlightsWhenConfiguredInCms = true })
                    .WhenLoggedInAsLeadPaxOrTradeAgent(_tradeAgentAuthService, _authenticationService);

            return await ProcessAmendBooking(request, booking);
        }

        private async Task<BookingResponse> ProcessAmendBooking(AmendBookingRequest request, BookingResponse bookingResponse)
        {
            if (!_tradeAgentAuthService.IsLoggedInAsTradeAgent() && request.PaymentInfo == null)
            {
                throw new ArgumentException($"{nameof(request.PaymentInfo)} is null", nameof(request));
            }

            if (request.BookingReference == null)
            {
                throw new ArgumentException($"{nameof(request.BookingReference)} is null", nameof(request));
            }

            await ValidateRequest(request, bookingResponse);

            // Atcom API client uses the session key to add a header to Atcom requests in order to route InfoModify and Modify requests to the same node
            var ejhSessionKey = await GetOrCreateEjhSessionKey(request.BookingReference);
            _contextAccessor.HttpContext.Items[_headersSettings.EJSessionHeader] = ejhSessionKey;
            _logger.LogInformation("Atcom modify booking session ID: {SessionId}", ejhSessionKey);

            var needToAddExtraFlightInformationIntoAtcomRequest = await _flightExtraService.NeedToAddExtraFlightInformationIntoAtcomRequest(bookingResponse?.Prom);
            await ValidatePromocode(request, bookingResponse, needToAddExtraFlightInformationIntoAtcomRequest);

            //if sessionId not specified, then we send stateful request
            //otherwise we should only validate to retrieve validateResponse and carry out the next steps
            var validateResponse = await _bookingRepository.ValidateAmendBookingInfo(request, bookingResponse, string.IsNullOrEmpty(request.SessionId), needToAddExtraFlightInformationIntoAtcomRequest);

            if (_tradeAgentAuthService.IsLoggedInAsTradeAgent())
            {
                request.PaymentInfo = new CardPaymentInfo
                {
                    Amount = 0,
                    CreditAmount = 0
                };
            }

            // Validate payment amount
            _amendmentChargesService.ValidateAmendCommitPayment(request, bookingResponse, validateResponse);

            var bookingRequest = BookingRequest.FromModifyBookingRequest(request);

            //enrich our model, because frontend doesn't have this data when trying to commit amend booking through "/commit" endpoint
            EnrichBookingRequest(bookingRequest, validateResponse);

            BookingResponse finalBookingResponse;

            //refund process
            if (request.ConvertType.HasValue && request.PaymentInfo.Amount < 0)
            {
                finalBookingResponse = await _amendBookingRefundService.ProcessRefund(bookingRequest,
                    validateResponse, bookingResponse, request.ConvertType.Value);
            }
            //regular payment process
            else
            {
                finalBookingResponse = await _bookingPaymentService.ProcessPayment(bookingRequest, validateResponse, 
                    async () => await _bookingRepository.CommitAmendBooking(bookingRequest));
            }

            await ModifyMemo(finalBookingResponse.BookingReference, request, bookingResponse);
            _logger.LogInformation("Booking was amended successfully: {BookingReference}", finalBookingResponse.BookingReference);
            _logger.LogInformation("Booking was amend: BookingReference - {BookingReference}, AmendmentCharges - {AmendmentCharges}, Promocode - {Promocode}, PromocodeStatus - {PromocodeStatus}",
                finalBookingResponse.BookingReference, validateResponse.PaymentInfo.AmendmentCharges, request?.PromoCodeBreakDown?.PromoCode, request?.PromoCodeBreakDown?.PromoCodeStatus);

            return finalBookingResponse;
        }

        private async Task ValidatePromocode(AmendBookingRequest request, BookingResponse bookingResponse, bool needToAddExtraFlightInformationIntoAtcomRequest)
        {
            if (request.DiscountCode.IsNullOrEmpty())
                return;

            var promocode = request.DiscountCode;
            request.DiscountCode = string.Empty;

            var validateResponse = await _bookingRepository.ValidateAmendBookingInfo(request, bookingResponse, false, needToAddExtraFlightInformationIntoAtcomRequest);

            var atcomPromocode = await _amendPromocodeHandlerService.GetAtcomPromocode(bookingResponse, validateResponse);

            if (!atcomPromocode.Promocode.Equals(promocode, StringComparison.InvariantCultureIgnoreCase))
                throw new ApiException(ApiExceptionCodes.PromotionIsNotValid, "Promocode is no longer aplicable for this amendment");

            request.DiscountCode = promocode;
        }

        /// <summary>
        /// Gets or creates and saves to Dynamo DB a session ID for Atcom's InfoModifyBooking and ModifyBooking requests
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <returns></returns>
        private async Task<string> GetOrCreateEjhSessionKey(string bookingReference)
        {
            if (string.IsNullOrEmpty(bookingReference))
            {
                return Guid.NewGuid().ToString();
            }

            var sessionKey = (await _bookingSessionService.GetBookingSession(bookingReference))?.SessionId;

            if (!string.IsNullOrWhiteSpace(sessionKey))
            {
                return sessionKey;
            }

            sessionKey = Guid.NewGuid().ToString();
            await _bookingSessionService.CreateBookingSession(new BookingSession
            {
                BookingRef = bookingReference,
                SessionId = sessionKey
            });

            return sessionKey;
        }

        /// <summary>
        /// Validates the request.
        /// </summary>
        /// <param name="request">The request.</param>
        /// <param name="bookingResponse">The booking response.</param>
        /// <exception cref="easyJet.Holidays.Api.Common.Exceptions.ApiException">null - Can't change pax information</exception>
        private async Task ValidateRequest(AmendBookingRequest request, BookingResponse bookingResponse)
        {
            if (!request.Pax.IsNullOrEmpty())
            {
                var amendNameAllow = await _amendBookingPassengerService.ValidatePaxNameChange(bookingResponse, request.Pax);

                if (!bookingResponse.AmendmentInfo.Pax.AmendAllow || !amendNameAllow)
                {
                    throw new ApiException(ApiExceptionCodes.AmendBookingPax, null, "Can't change pax information");
                }
            }

            var transferChange = request.Transfers is not null;
            var dateChange = request.Offer is not null;
            var seatSelectedForDateChange = request.Offer?.SeatSelection?.Any(x => x.Seats is not null && x.Seats.Any()) ?? false;

            var seatChangeSettings = await _settingsService.GetSeatMapSettings();
            var seatChangeDisabled = !seatChangeSettings.EnableSeatMapDateChange;

            if (dateChange && seatSelectedForDateChange && seatChangeDisabled)
            {
                throw new ApiException(ApiExceptionCodes.AmendBookingSeats, null, "Can't change seats in date change flow");
            }

            if (dateChange || transferChange)
            {
                var luggage = bookingResponse?.ExtraLuggageInfo?.Items;
                var luggageContainsSportEquipment = await _luggageService.ContainsSportEquipment(luggage);

                if (luggageContainsSportEquipment)
                    throw new ApiException(
                        ApiExceptionCodes.NoAmendFlightAndTransferForSportEquipment,
                        "Can't amend flight or transfer for booking with sport equipment"
                    );
            }
        }

        /// <summary>
        /// Modifies booking memo.
        /// </summary>
        /// <param name="bookingReference">The booking reference.</param>
        /// <param name="request">The request.</param>
        /// <param name="bookingResponse">Initial booking</param>
        private async Task ModifyMemo(string bookingReference, AmendBookingRequest request, BookingResponse bookingResponse)
        {
            var memo = _memoService.GetAmendmentMemo(request, bookingResponse);

            if (memo != null)
            {
                await _bookingRepository.ModifyMemo(bookingReference, memo);
            }
        }

        /// <summary>
        /// Enrich <see cref="BookingRequest"/> model with required data for the payment service
        /// </summary>
        /// <param name="bookingRequest"></param>
        /// <param name="validateResponse"></param>
        private static void EnrichBookingRequest(BookingRequest bookingRequest, ValidateAmendBookingResponse validateResponse)
        {
            if (string.IsNullOrEmpty(bookingRequest.SessionId))
            {
                bookingRequest.SessionId = validateResponse.SessionId;
                bookingRequest.RequestId = validateResponse.RequestId;
            }

            bookingRequest.Guests = validateResponse.Guests;
            bookingRequest.LeadPassenger = validateResponse.LeadPassenger;

            if (bookingRequest.Offer?.Transport == null)
            {
                //the need for a payment service
                bookingRequest.Offer = new Offer
                {
                    Transport = validateResponse.Transport
                };
            }
        }
    }
}
