using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Mappers;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Services.Vouchers;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net;
using System.Runtime.CompilerServices;
using Memo = easyJet.Holidays.Api.Domain.Data.Booking.Memo;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests.Services.Booking.BookingFetchServiceTests")]
namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public class BookingFetchService : IBookingFetchService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IHotelsService _hotelsService;
        private readonly IAuthenticationService _authenticationService;
        private readonly IBookingTokenService _bookingTokenService;
        private readonly ILogger<BookingFetchService> _logger;
        private readonly AtcomSettings _atcomSettings;
        private readonly ApiSettings _apiSettings;
        private readonly IBookingSpecialRequestService _bookingSpecialRequestService;
        private readonly IContentService _contentService;
        private readonly IBookingRefundEligibleService _bookingRefundEligibleService;
        private readonly ITransferService _transferService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IErrataInfoService _errataInfoService;
        private readonly ILanguageService _languageService;
        private readonly IAirportsMapper _airportsMapper;
        private readonly IB2BBookingService _b2BBookingService;
        private readonly IAirportParkingService _airportParkingService;
        private readonly IVouchersService _vouchersService;
        private readonly IBookingCancellationCreditRulesEngine _bookingCancellationRulesEngine;
        private readonly IBookingRefundService _bookingRefundService;
        private readonly IBookingBlockCheckerService _bookingBlockCheckerService;

        public BookingFetchService(
            IOptions<AtcomSettings> atcomSettings,
            IOptions<ApiSettings> apiSettings,
            IHotelsService hotelsService,
            IAuthenticationService authenticationService,
            ILogger<BookingFetchService> logger,
            IBookingRepository bookingRepository,
            IBookingTokenService bookingTokenService,
            IBookingSpecialRequestService bookingSpecialRequestService,
            IContentService contentService,
            IBookingRefundEligibleService bookingRefundEligibleService,
            ITransferService transferService,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IErrataInfoService errataInfoService,
            ILanguageService languageService,
            IAirportsMapper airportMapper,
            IB2BBookingService b2BBookingService, 
            IAirportParkingService airportParkingService,
            IVouchersService vouchersService,
            IBookingCancellationCreditRulesEngine bookingCancellationRulesEngine,
            IBookingRefundService bookingRefundService,
            IBookingBlockCheckerService bookingBlockCheckerService
            )
        {
            _bookingRepository = bookingRepository;
            _atcomSettings = atcomSettings.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _authenticationService = authenticationService;
            _logger = logger;
            _hotelsService = hotelsService;
            _bookingTokenService = bookingTokenService;
            _bookingSpecialRequestService = bookingSpecialRequestService;
            _contentService = contentService;
            _bookingRefundEligibleService = bookingRefundEligibleService;
            _transferService = transferService;
            _tradeAgentAuthService = tradeAgentAuthService;
            _errataInfoService = errataInfoService;
            _languageService = languageService;
            _airportsMapper = airportMapper;
            _b2BBookingService = b2BBookingService;
            _airportParkingService = airportParkingService;
            _vouchersService = vouchersService;
            _bookingCancellationRulesEngine = bookingCancellationRulesEngine;
            _bookingRefundService = bookingRefundService;
            _bookingBlockCheckerService = bookingBlockCheckerService;
        }

        /// <inheritdoc />
        public async Task<BookingResponse> Get(GetBookingRequest request)
        {
            var booking = await _bookingRepository.GetBooking(request);
            var language = _languageService.GetCurrentLanguage();

            await EnrichAndSecureBookingResponse(booking);

            await ValidateByBookingPrivacy(booking);

            await _errataInfoService.EnrichWithFlightErrataInfo(booking, language);

            await _contentService.UpdateHealsEntryRequirementsContent(booking);

            return booking;

        }

        /// <inheritdoc />
        public async Task<string> GetBookingStatus(GetBookingRequest request)
        {
            var booking = await _bookingRepository.GetBooking(request);

            return booking.BookingStatus;
        }

        /// <inheritdoc />
        public Task<BookingResponse> Get(string token)
        {
            var request = _bookingTokenService.ParseGetBookingToken(token);
            return Get(request);
        }

        /// <inhritdoc />
        public async Task EnrichAndSecureBookingResponse(BookingResponse booking)
        {
            var language = _languageService.GetCurrentLanguage();

            booking.CanBeChanged = await BookingCanBeChanged(booking);
            booking.Refund = await _bookingRefundEligibleService.IsEligibleForFullRefund(booking);

            // Delete payment inforation if customer is not logged in
            var isLoggedInAsLeadPax = await _authenticationService.IsLoggedInAsLeadPax(booking.LeadPassenger.Email);
            booking.IsLoggedInAsLeadPassenger = isLoggedInAsLeadPax;
            if (!isLoggedInAsLeadPax)
            {
                // strip info for not logged in customer
                if (booking.PaymentInfo.PaymentHistory != null)
                {
                    foreach (var ph in booking.PaymentInfo.PaymentHistory)
                    {
                        ph.Card = null;
                    }
                }

                // this information is relevant for trade agents, cc related info gets removed though
                if (!_tradeAgentAuthService.IsLoggedInAsTradeAgent())
                {
                    booking.LeadPassenger = null;
                }
            }

            // Make sure balanceDueAmount is always >= 0 for client api
            booking.PaymentInfo.BalanceDueAmount = booking.PaymentInfo.BalanceDueAmount < 0 ? 0 : booking.PaymentInfo.BalanceDueAmount;

            // Enrich with hotels details
            var accommodation = booking.Package.Accom;
            var hotels = await _hotelsService.Search(new[] { accommodation.Code });

#pragma warning disable S1135
            // TODO Don't send hotel model back to client, but use OfferHotel mapping for it. 
#pragma warning restore S1135
            booking.Hotel = hotels.FirstOrDefault();
            if (booking.Hotel != null)
            {
                // Also clean up room types and board types to reduce response size
                var roomCodes = accommodation.Rooms.Select(x => x.Code);
                var boardCodes = accommodation.Rooms.Select(x => x.Board);
                booking.Hotel.RoomTypes = booking.Hotel.RoomTypes?.Where(x => roomCodes.Contains(x.Code));
                booking.Hotel.BoardTypes = booking.Hotel.BoardTypes?.Where(x => boardCodes.Contains(x.Code));
            }

            // Enrich Airport names            
            await _airportsMapper.EnrichAirportsDetails(booking.Package.Transport.Routes);

            await _transferService.EnrichWithTransferInfo(booking.Transfers, language);

            var memoList = await _bookingRepository.GetBookingMemo(booking.BookingReference);
            var groupedMemosByCode = memoList.GroupBy(m => m.Code.ToUpperInvariant()).ToDictionary(g => g.Key, g => g.ToList());
            var fraudDetected = groupedMemosByCode.ContainsKey(_atcomSettings.FraudCode.ToUpperInvariant());

            if (fraudDetected)
            {
                throw new ApiException(ApiExceptionCodes.BookingFraudError, "Can not find a booking", null, null, HttpStatusCode.BadRequest);
            }
            
            booking.wasCredited = BookingWasCredited(groupedMemosByCode);
            booking.WasRefunded = BookingWasRefunded(groupedMemosByCode);
            booking.IsPrivate = BookingIsPrivate(memoList);
            booking.Memo = memoList;
            booking.CancellationIsBlocked = await _bookingBlockCheckerService.CheckIfBookingIsBlocked(booking);
            booking.SpecialRequests = (await _bookingSpecialRequestService.GetSpecialRequestsByCodes(groupedMemosByCode.Keys)).ToArray();
            booking.B2BData = await _b2BBookingService.GetBooking(booking);
            booking.CancelledBookingRefundSummary = GetCancelledBookingRefundSummary(booking);

            await _bookingSpecialRequestService.EnsureAmmendSSr(booking);

            AddTerminalsToRoutes(booking);
            AddFlightDisruptionInfo(booking);
            
            var eligibleCreditOnlyRules = await _bookingCancellationRulesEngine.FindEligibleRule(booking);
            booking.IsDestinationRulesApplied = eligibleCreditOnlyRules is { Count: > 0 };
            
            // enrich with airport parking details 
            await _airportParkingService.EnrichBookingWithAirportParking(booking.AirportParking);
        }

        internal CancelledBookingRefundSummary GetCancelledBookingRefundSummary(BookingResponse bookingResponse)
        {
            if (!(bookingResponse.BookingStatus?.Equals(_atcomSettings.BookingStatus.Canceled, StringComparison.OrdinalIgnoreCase) ?? false))
            {
                return null;
            }

            var voucherRefundAmount = _vouchersService.GetRefundAmountFromCreditRefundMemo(bookingResponse);
            var refundedCashAmount = _bookingRefundService.GetRefundAmountFromCashRefundMemo(bookingResponse);

            var refundedCash = refundedCashAmount ?? 0;
            var refundedCredit = voucherRefundAmount ?? 0;
            var refundedTotal = refundedCash + refundedCredit;

            return new CancelledBookingRefundSummary()
            {
                CashRefundAmount = refundedCash,
                CreditRefundAmount = refundedCredit,
                TotalRefundAmount = refundedTotal,
                Currency = bookingResponse.Currency.Code
            };
        }

        private static void AddTerminalsToRoutes(BookingResponse booking)
        {
            foreach (var route in booking.Package.Transport.Routes)
            {
                var b2bflight = booking.B2BData.MatchFlight(route.FlightNumberWithoutCar);
                route.ArrTerminal = b2bflight?.Arrival?.Terminal?.Name;
                route.DepTerminal = b2bflight?.Departure?.Terminal?.Name;
            }
        }

        /// <summary>
        /// Get first outbound route for booking
        /// </summary>
        /// <param name="transport">Trnsport information</param>
        /// <returns></returns>        
        public static Route GetOutboundRoute(Transport transport)
        {
            return transport.Routes.FirstOrDefault(r => r.Direction == Direction.Outbound);
        }

        /// <inheritdoc />        
        public async Task<bool> BookingCanBeChanged(BookingResponse booking)
        {
            if (!_atcomSettings.ChangeBooking.IsActive)
            {
                return false;
            }

            // Only bookings in status "BOOKING" can be changed
            if (!_atcomSettings.ChangeBooking.AllowedStatuses.Contains(booking.BookingStatus))
            {
                return false;
            }

            // Full paid and earlier than specified Date
            var fullPaid = booking.PaymentInfo.BalanceDueAmount <= 0;
            if (!fullPaid) return false;

            var outboundRoute = booking?.Package?.Transport.Routes.FirstOrDefault(r => r.Direction == Direction.Outbound);

            // Booking outboundRoute is later than now
            if (outboundRoute?.DepDate <= DateTimeOffset.Now.Date) return false;

            var isBeforeExpirationDate = outboundRoute?.DepDate < _atcomSettings.ChangeBooking.ChangeAllowedExpirationDate;

            // Not full paid OR after expiration date (if it's turned on)
            if (_atcomSettings.ChangeBooking.UseChangeExpirationDate && !isBeforeExpirationDate) return false;

            if (!_atcomSettings.ChangeBooking.AllowMultipleChanges)
            {
                // Also check if booking was already changed
                var memos = await _bookingRepository.GetBookingMemo(booking.BookingReference);
                var memoSettings = _atcomSettings.ChangeBooking.Memo;
                if (memos.Any(m => m.Code == memoSettings.CancelledBookingCode || m.Code == memoSettings.NewBookingCode))
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Adds flight disruption information to the booking.
        /// </summary>
        private static void AddFlightDisruptionInfo(BookingResponse booking)
        {
            if (booking?.B2BData?.IsDisrupted() != true) return;

            var paxIndex = 0;
            var disruption = new DisruptionInfo();

            foreach (var passenger in booking?.B2BData?.Passengers?.Passenger ?? Enumerable.Empty<Passenger>())
            {
                if (passenger.Itinerary?.Segment == null) continue;

                foreach (var segment in passenger.Itinerary.Segment)
                {
                    if (string.IsNullOrEmpty(segment.Disruption?.Level)) continue;

                    var disruptionItinerary = new DisruptionItineraryInfo()
                    {
                        PaxIndex = paxIndex,
                        ArrivalTerminal = segment.Flight?.Arrival?.Terminal != null
                            ? new DisruptionItineraryTerminal()
                            {
                                Code = segment.Flight.Arrival.Terminal.Code,
                                Name = segment.Flight.Arrival.Terminal.Name,
                            } : null,
                        DepartureTerminal = segment.Flight?.Departure?.Terminal != null
                            ? new DisruptionItineraryTerminal()
                            {
                                Code = segment.Flight.Departure.Terminal.Code,
                                Name = segment.Flight.Departure.Terminal.Name,
                            } : null,
                        CarrierCode = segment.Flight?.CarrierCode,
                        FlightKey = segment.Flight?.FlightKey,
                        FlightNumber = segment.Flight?.FlightNumber,
                        DisruptionLevel = segment.Disruption?.Level
                    };

                    disruption.Itinerary.Add(disruptionItinerary);
                }

                paxIndex++;
            }

            booking.DisruptionInfo = disruption;
        }

        /// <summary>
        /// Check if booking has memo "REP3" thats mean that booking was credited
        /// </summary>
        /// <param name="groupedMemosByCode"></param>
        /// <returns></returns>
        private bool BookingWasCredited(Dictionary<string, List<Memo>> groupedMemosByCode)
        {
            var code = GetNormalizedCode(_apiSettings.Vouchers.BookingMemos.MovedToCredit.Code);
            return groupedMemosByCode.ContainsKey(code);
        }

        /// <summary>
        /// Check if booking has memo "REP4" which means that booking was credited and cashed
        /// </summary>
        /// <param name="groupedMemosByCode"></param>
        /// <returns></returns>
        private bool BookingWasRefunded(Dictionary<string, List<Memo>> groupedMemosByCode)
        {
            var code = GetNormalizedCode(_apiSettings.Vouchers.BookingMemos.MovedToCreditAndCash.Code);
            return groupedMemosByCode.ContainsKey(code);
        }

        /// <summary>
        /// Check if booking has memo "PRVC" which means that booking has privacy attribute
        /// </summary>
        /// <param name="memo"></param>
        /// <returns></returns>
        public bool BookingIsPrivate(List<Memo> memo)
        {
            var privacyMemo = memo?.FirstOrDefault(x => x.Code == _atcomSettings.ChangeBooking.Memo.BookingPrivacyCode);
            return privacyMemo?.Text == _atcomSettings.ChangeBooking.Memo.BookingIsPrivateText;
        }

        private static string GetNormalizedCode(string code)
        {
            return code.ToUpperInvariant();
        }
        
        /// <summary>
        /// Validate current user by booking privacy
        /// </summary>
        /// <param name="booking">Booking response</param>
        /// <returns></returns>
        public async Task ValidateByBookingPrivacy(BookingResponse booking)
        {

            var bookingEmail = booking?.CustomerDetails?.Email ?? string.Empty;
            if (booking?.IsPrivate == true)
            {
                var customerEmail = await _authenticationService.GetCustomerEmail();
                if (!bookingEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
                {
                    throw new ApiException(ApiExceptionCodes.BookingCannotGetPrivacy, "Can not get a privacy booking information. Only owner can get it", null, null, HttpStatusCode.BadRequest);
                }
            }
        }
    }
}