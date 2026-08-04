﻿using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.RoomAndBoard;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Transfers;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Monitoring;
using easyJet.Holidays.Api.Domain.Monitoring.Analytics;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Net;

namespace easyJet.Holidays.Api.Controllers
{
    /// <summary>
    /// Amend booking endpoints to modify existing bookings
    /// </summary>
    [Route("amend")]
    [ApiController]
    [ApiVersion("1.0")]
    public class AmendBookingController : ControllerBase
    {
        private readonly ApiSettings _apiSettings;
        private readonly HeadersSettings _headerSettings;
        private readonly IIdempotentBookingService _idempotentBookingService;
        private readonly IAmendSeatsService _amendSeatsService;
        private readonly IAmendBookingFlightsService _amendBookingFlightsService;
        private readonly IAmendBookingTransfersService _amendBookingTransfersService;
        private readonly IAmendBookingRefundService _amendBookingRefundService;
        private readonly IAmendPassengerService _amendBookingPassengerService;
        private readonly IBookingChangeService _bookingChangeService;
        private readonly ITradeAgentAuthenticationService _tradeAgentAuthService;
        private readonly IAmendDatesService _amendDatesService;
        private readonly IAmendLuggageService _amendLuggageService;
        private readonly IAmendBookingRoomAndBoardService _amendBookingRoomAndBoardService;
        private readonly IAmendHotelService _amendHotelService;
        private readonly IMetricsService _metricsService;
        private readonly IOtelAnalyticsService _otelAnalyticsService;
        private readonly IMarketService _marketService;

        /// <summary>
        /// Amend Booking Controller constructor
        /// </summary>
        public AmendBookingController(IOptions<ApiSettings> apiSettings,
            IOptions<HeadersSettings> headerSettings,
            IIdempotentBookingService idempotentBookingService,
            IAmendBookingFlightsService amendBookingFlightsService,
            IAmendBookingTransfersService amendBookingTransfersService,
            IAmendBookingRefundService amendBookingRefundService,
            IAmendPassengerService amendBookingPassengerService,
            IBookingChangeService bookingChangeService,
            IAmendSeatsService amendSeatsService,
            ITradeAgentAuthenticationService tradeAgentAuthService,
            IAmendDatesService amendDatesService,
            IAmendLuggageService amendLuggageService,
            IAmendBookingRoomAndBoardService amendBookingRoomAndBoardService,
            IAmendHotelService amendHotelService,
            IMetricsService metricsService,
            IOtelAnalyticsService otelAnalyticsService,
            IMarketService marketService)
        {
            _idempotentBookingService = idempotentBookingService;
            _amendBookingFlightsService = amendBookingFlightsService;
            _amendBookingTransfersService = amendBookingTransfersService;
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));
            _headerSettings = headerSettings.Value ?? throw new ArgumentNullException(nameof(headerSettings));
            _amendBookingRefundService = amendBookingRefundService;
            _amendBookingPassengerService = amendBookingPassengerService;
            _bookingChangeService = bookingChangeService;
            _amendSeatsService = amendSeatsService;
            _tradeAgentAuthService = tradeAgentAuthService;
            _amendDatesService = amendDatesService;
            _amendLuggageService = amendLuggageService;
            _amendBookingRoomAndBoardService = amendBookingRoomAndBoardService;
            _amendHotelService = amendHotelService;
            _metricsService = metricsService;
            _otelAnalyticsService = otelAnalyticsService;
            _marketService = marketService;
        }

        /// <summary>
        /// Endpoint used to submit booking changes
        /// </summary>
        /// <param name="request">Amend booking request</param>
        /// <response code="200">Amendment booking confirmation response</response>
        /// <response code="202">PaymentAuthorization information </response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="500">Server-side error has occurred</response>
        /// <response code="503">Server-side error has occurred</response>
        [HttpPost]
        [Route("commit")]
        [ProducesResponseType(typeof(BookingResponse),
            (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(MakePaymentResponse),
            (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(IdempotencyKeyAttribute))]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        [EnforceKeyNamesForSensitiveDataInPaymentInfo]
        public async Task<IActionResult> AmendBooking([FromBody] AmendBookingRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request body cannot be null");
            }
            
            try
            {
                if (!_tradeAgentAuthService.IsLoggedInAsTradeAgent() &&
                    request.PaymentInfo?.CreditAmount > 0 &&
                    !_apiSettings.Vouchers.IsActive)
                {
                    return BadRequest("Credit is disabled");
                }

                var idempotencyKey = Request.Headers[_headerSettings.IdempotencyKey];

                var finalAtcomResponse = await _idempotentBookingService.AmendBooking(request,
                    idempotencyKey);

                await RecordAmendmentMetricsAsync(request, finalAtcomResponse);

                return Ok(finalAtcomResponse);
            }
            catch (PaymentAuthorisationRequiredException pirEx)
            {
                return Ok(pirEx.PaymentResponse);
            }
        }

        /// <summary>
        /// Records the amend_booking counter and analytics event for a completed amendment.
        /// </summary>
        private async Task RecordAmendmentMetricsAsync(AmendBookingRequest request, BookingResponse finalAtcomResponse)
        {
            var amendmentType = request.ResolveAmendmentType().ToMetricLabel();

            _metricsService.IncrementCounter(MetricConstants.WebAmendBookingTotal, 1,
                new KeyValuePair<string, object>("is_trade_agent", _tradeAgentAuthService.IsLoggedInAsTradeAgent()),
                new KeyValuePair<string, object>("market_code", _marketService.GetCurrentMarket()?.Code),
                new KeyValuePair<string, object>("hotel_type", HotelExtensions.GetHotelType(finalAtcomResponse?.Package?.Accom?.Code ?? MetricConstants.UnknownLabel)),
                new KeyValuePair<string, object>("amendment_type", amendmentType));

            await _otelAnalyticsService.TrackAmendBookingAsync(request, finalAtcomResponse, amendmentType);
        }

        /// <summary>
        /// Amend booking luggage 
        /// </summary>
        /// <param name="amendLuggageRequest">Request with new extra luggage info</param>
        [HttpPost]
        [Route("luggage")]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(AmendLuggageResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> AmendLuggage([FromBody, Required] AmendLuggageRequest amendLuggageRequest)
        {
            var response = await _amendLuggageService.ChangeExtraLuggage(amendLuggageRequest);

            return Ok(response);
        }

        /// <summary>
        /// Change seat selection
        /// </summary>
        /// <param name="amendSeatsRequest">Amend seats request with new seat selection data</param>
        /// <returns></returns>
        [HttpPost]
        [Route("seats")]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        public async Task<IActionResult> ChangeSeats([FromBody] AmendSeatsRequest amendSeatsRequest)
        {
            var result = await _amendSeatsService.ChangeSeats(amendSeatsRequest);
            return Ok(result);
        }

        /// Search alternative flights without details
        /// Usually first request to get information about all available alternative flights
        /// <param name="bookingReference">Booking reference.</param>
        /// <returns>Alternative flights response</returns>
        /// <response code="200">Search results</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpGet]
        [Route("alternative-flights")]
        [ProducesResponseType(typeof(AmendFlightOfferResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> AlternativeFlights([FromQuery] string bookingReference)
        {
            ValidateQuery(bookingReference);

            var alternativeFlightsResponse = await _amendBookingFlightsService.GetAlternativeFlights(bookingReference);



            return Ok(alternativeFlightsResponse);
        }

        /// <summary>
        /// Get amend booking flights live price
        /// </summary>
        /// <param name="amendBookingFlightsPriceRequest"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("alternative-flights/validate")]
        [ProducesResponseType(typeof(AlternativeFlightFullPriceResponse),
            (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> AlternativeFlightFullLivePrice(
            [FromBody] AlternativeFlightFullPriceRequest amendBookingFlightsPriceRequest)
        {
            var alternativeFlightsResponse =
                await _amendBookingFlightsService.GetAlternativeFlightFullPrice(amendBookingFlightsPriceRequest);

            return Ok(alternativeFlightsResponse);
        }

        /// <summary>
        /// Get amend booking transfers live price
        /// </summary>
        /// <param name="amendBookingTransfersRequest"></param>
        /// <returns></returns>
        /// <response code="200">Collection of transfers with amendment price</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpPost]
        [Route("alternative-transfers/validate-price")]
        [ProducesResponseType(typeof(AmendBookingTransfersResponse),
            (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> AlternativeTransfersPrice(
            [FromBody] AmendBookingTransfersRequest amendBookingTransfersRequest)
        {
            var amendBookingTransfersResponse =
                await _amendBookingTransfersService.GetAmendTransfersPrice(amendBookingTransfersRequest);
            return Ok(amendBookingTransfersResponse);
        }

        /// <summary>
        /// Get alternative transfers with live price
        /// </summary>
        /// <param name="alternativeTransfersSearchRequest">Search parameters for finding transfers and booking reference</param>
        /// <returns></returns>
        /// <response code="200">Collection of transfers with amendment price</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Unable to search</response>
        [HttpPost]
        [Route("alternative-transfers/price")]
        [ProducesResponseType(typeof(AmendBookingTransfersResponse),
            (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> AmendmentTransfers(
             [FromBody] AlternativeTransfersSearchRequest alternativeTransfersSearchRequest)
        {
            var amendBookingTransfersResponse =
               await _amendBookingTransfersService.GetAlternativeTransfersWithPrice(alternativeTransfersSearchRequest);

            return Ok(amendBookingTransfersResponse);
        }

        /// <summary>
        /// Get information of partial refund by amount
        /// </summary>
        /// <param name="request">Partial refund request</param>
        /// <returns>Eligible for partial refund</returns>
        /// <response code="200">Eligible for partial refund</response>
        [HttpPost]
        [Route("partial-refund/validate")]
        [ProducesResponseType(typeof(EligibleForRefund),
            (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        public async Task<IActionResult> PartialRefundValidate([FromBody] AmendBookingPartialRefundRequest request)
        {
            var eligibleForRefund = await _amendBookingRefundService.EligibleForPartialRefund(request);

            return Ok(eligibleForRefund);
        }

        /// <summary>
        /// Changes the name validation.
        /// </summary>
        /// <param name="amendNameRequest">The amend name request.</param>
        /// <returns></returns>
        [HttpPost]
        [Route("pax-name")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> ChangeNameValidation([FromBody] AmendPaxRequest amendNameRequest)
        {
            var result = await _amendBookingPassengerService.ValidatePaxNameChange(amendNameRequest);
            return Ok(result);
        }

        /// <summary>
        /// Endpoint to validate passenger information.
        /// </summary>
        /// <param name="amendPaxRequest">Passenger information that should be validated</param>
        /// <returns>Flag for each passenger in request.</returns>
        /// <exception cref="ArgumentNullException">Request can not be null.</exception>
        /// <exception cref="ArgumentNullException">Passenger list can not be null.</exception>
        [HttpPost]
        [Route("pax-limit-validation")]
        [ProducesResponseType(typeof(IEnumerable<AmendPaxValidationResponse>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> ChangeNameLimitValidation([FromBody] AmendPaxValidationRequest amendPaxRequest)
        {
            var result = await _amendBookingPassengerService.ValidatePaxChangeLimit(amendPaxRequest);

            return Ok(result);
        }

        /// <summary>
        /// Amend booking SSRs
        /// </summary>
        /// <param name="request">Amend SSR request</param>
        /// <returns></returns>
        /// <response code="200">Amendment booking info</response>
        /// <response code="400">Bad requests, parameters do no match</response>
        /// <response code="503">Server-side error has occurred</response>
        [HttpPost]
        [Route("amend-ssr")]
        [ProducesResponseType(typeof(BookingResponse), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [NoCacheControl]
        public async Task<IActionResult> AmendSpecialRequest([FromBody] AmendSsrRequest request)
        {
            var booking = await _bookingChangeService.AmendSpecialRequests(request);
            return Ok(booking);
        }

        /// <summary>
        /// Get booking available date.
        /// </summary>
        /// <param name="request" cref="AmendDateInfoRequest">Amend date info request.</param>
        /// <returns>Available start dates for booking.</returns>
        [HttpGet]
        [Route("amend-date/info")]
        [ProducesResponseType(typeof(AmendDateInfoResponse), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetAmendDatesCalendarData([FromQuery] AmendDateInfoRequest request)
        {
            var result = await _amendDatesService.GetAvailableBookingDate(request);
            return Ok(result);
        }

        /// <summary>
        /// Get change dates summary information.
        /// </summary>
        /// <param name="request" cref="AmendDatesSummaryRequest">Amend dates summary request.</param>
        /// <param name="cancellationToken"></param>
        /// <returns>Available offers with flags.</returns>
        /// <response code="200">Available offers for date changing.</response>
        /// <response code="400">Bad requests, can not find packages with this parameter.</response>
        [HttpGet]
        [Route("amend-dates/summary")]
        [ProducesResponseType(typeof(AmendDatesOffer), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetAmendDatesSummary([FromQuery] AmendDatesSummaryRequest request, CancellationToken cancellationToken)
        {
            var result = await _amendDatesService.GetAmendDatesSummary(request, cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Get available transfers for change date flow.
        /// </summary>
        /// <param name="request" cref="AmendDatesOffer">Offer for current state of change date summary page.</param>
        /// <returns>List of available states of change date summary page which build on available transfer options.</returns>
        /// <response code="200">Available transfer options.</response>
        [HttpPost]
        [Route("amend-dates/transfer")]
        [ProducesResponseType(typeof(IEnumerable<AmendDatesOffer>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetAvailableTransferOption([FromBody] AmendDatesOffer request)
        {
            var result = await _amendBookingTransfersService.GetAlternativeTransfers(request);

            return Ok(result);
        }

        /// <summary>
        /// Get alternative flights for selected offer.
        /// </summary>
        /// <param name="request">Offer for current state of change date summary page.</param>
        /// <returns></returns>
        [HttpPost]
        [Route("amend-dates/flights")]
        [ProducesResponseType(typeof(IEnumerable<AmendDatesOffer>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetAlternativeFlightOption([FromBody] AmendDatesOffer request)
        {
            var result = await _amendBookingFlightsService.GetAlternativeFlights(request);

            return Ok(result);
        }

        /// <summary>
        /// Validate alternative flight price.
        /// </summary>
        /// <param name="flightOffers"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("amend-dates/validate")]
        [ProducesResponseType(typeof(IEnumerable<AmendDatesOffer>), (int)HttpStatusCode.OK)]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        public async Task<IActionResult> ValidateOffers([FromBody] IEnumerable<AmendDatesOffer> flightOffers)
        {
            var result = await _amendDatesService.ValidateAmendDatesOffers(flightOffers);
            return Ok(result);
        }

        /// <summary>
        /// Get alternative room and boards from atcom cache.
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <returns>Available combination of room and board.</returns>
        /// <response code="200">Available room and board options.</response>
        /// <response code="400">Can not to find current flight in Atcom.</response>
        /// <response code="400">Can not to find rooms for these accommodations.</response>
        [HttpGet]
        [Route("amend-room-and-board/info")]
        [ProducesResponseType(typeof(AmendRoomVariantsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(Dictionary<string, object>), (int)HttpStatusCode.BadRequest)]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        public async Task<IActionResult> GetAlternativeRoomAndBoards([FromQuery] string bookingReference)
        {
            ValidateQuery(bookingReference);
            var result = await _amendBookingRoomAndBoardService.GetAvailableRoomAndBoards(bookingReference);
            return Ok(result);
        }

        /// <summary>
        /// Validate room variants with VRP request in Atcom
        /// </summary>
        /// <param name="request" cref="AmendRoomValidationRequest"></param>
        /// <returns>Room variant with calculated price.</returns>
        /// <response code="200">Room variant with calculated price.</response>
        /// <response code="400">BookingRef can not be null or empty.</response>
        /// <response code="400">SelectedRoomVariant can not be null.</response>
        /// <response code="400">RoomVariants can not be empty.</response>
        [HttpPost]
        [Route("amend-room-and-board/validate")]
        [ProducesResponseType(typeof(AmendRoomVariantsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(Dictionary<string, object>), (int)HttpStatusCode.BadRequest)]
        [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
        public async Task<IActionResult> ValidateAlternativeRoomAndBoard([FromBody] AmendRoomValidationRequest request)
        {
            var result = await _amendBookingRoomAndBoardService.ValidateAlternativeRoomAndBoard(request);

            return Ok(result);
        }
        
        /// <summary>
        /// Receive alternative hotel options for current booking.
        /// </summary>
        /// <param name="request" cref="GetAmendHotelListRequest">Request with selected filter.</param>
        /// <returns cref="GetAmendHotelListResponse">Available hotel options with filter metadata.</returns>
        /// <response code="200">Alternative hotels available in Atcom. All offers were enrich with sitecore and voucher information.</response>
        /// <response code="200">There are no alternative hotels in Atcom.</response>
        /// <response code="400">Request parameter are invalid.</response>
        /// <response code="400">Can not to find a booking with this BookingRef.</response>
        /// <response code="400">Can not to amend booking.</response>
        /// <response code="500">Only lead passenger can amend booking.</response>
        [HttpPost]
        [Route("amend-hotel/hotel-list")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(GetAmendHotelListResponse), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> GetAlternativeHotelList([FromBody] GetAmendHotelListRequest request)
        {
            var result = await _amendHotelService.GetAmendHotelList(request);
            return Ok(result);
        }

        /// <summary>
        /// Validate alternative hotel option
        /// </summary>
        /// <param name="request" cref="AmendHotelRequest">Selected hotel offer.</param>
        /// <returns cref="AmendHotelResponse">Selected hotel offer with live price and promocode calculation.</returns>
        /// <response code="200">Valid selected hotel offer.</response>
        /// <response code="400">Can not to validate selected offer.</response>
        /// <response code="400">Can not amend hotel by any restriction.</response>
        /// <response code="401">Only lead passenger can amend booking.</response>
        [HttpPost]
        [Route("amend-hotel/validate")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(AmendHotelResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(Dictionary<string, object>), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> ValidateAlternativeHotel([FromBody] AmendHotelRequest request)
        {
            var result = await _amendHotelService.ValidateAlternativeHotel(request);

            return Ok(result);
        }

        /// <summary>
        /// Get alternative room and board for new hotel selection
        /// </summary>
        /// <param name="request" cref="AmendHotelRequest">Selected hotel offer.</param>
        /// <returns cref="IEnumerable{AmendHotelResponse}">Alternative rooms and board offers for selected hotels.</returns>
        /// <response code="200">Alternative rooms and board offers for selected hotels.</response>
        /// <response code="204">Can not to find any alternative options.</response>
        /// <response code="400">Can not amend hotel by any restriction.</response>
        /// <response code="401">Only lead passenger can amend booking.</response>
        [HttpPost]
        [Route("amend-hotel/alternative-rooms-and-boards")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(GetAmendHotelRoomsResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(Dictionary<string, object>), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetAlternativeRoomAndBoardForHotel([FromBody] AmendHotelRequest request)
        {
            var result = await _amendHotelService.GetAlternativeRooms(request);

            return Ok(result);
        }

        /// <summary>
        /// Get alternative transfers for new hotel selection
        /// </summary>
        /// <param name="request" cref="AmendHotelRequest">Selected hotel offer.</param>
        /// <returns cref="IEnumerable{AmendHotelResponse}">Alternative transfer offers for selected hotel.</returns>
        /// <response code="200">Alternative transfer offers for selected hotel.</response>
        /// <response code="204">Can not to find any alternative options.</response>
        /// <response code="400">Can not amend hotel by any restriction.</response>
        /// <response code="401">Only lead passenger can amend booking.</response>
        [HttpPost]
        [Route("amend-hotel/alternative-transfers")]
        [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
        [ProducesResponseType(typeof(IEnumerable<AmendHotelResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(Dictionary<string, object>), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetAlternativeTransfersForHotel([FromBody] AmendHotelRequest request)
        {
            var result = await _amendHotelService.GetAlternativeTransfers(request);

            return Ok(result);
        }

        private void ValidateQuery(string bookingReference)
        {
            if (string.IsNullOrEmpty(bookingReference))
            {
                throw new ApiException(
                    ApiExceptionCodes.ArgumentException,
                    $"{nameof(bookingReference)} can not be null or empty.",
                    null,
                    null,
                    HttpStatusCode.BadRequest);
            }
        }
    }
}