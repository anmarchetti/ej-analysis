using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.SharedServices
{
    /// <summary>
    /// Booking cancellation controller
    /// </summary>
    /// <remarks>
    /// Constructor
    /// </remarks>
    /// <param name="bookingCancellationService"></param>
    [Route("shared-services/booking/cancellation")]
    [ApiVersion("1.0")]
    [ServiceFilter(typeof(DisableValidationAttribute))]
    [ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
    [ApiController]
    [ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
    public class BookingCancellationSharedServicesController(
        IBookingCancellationService bookingCancellationService
    ) : ControllerBase
    {
        private const string SummaryRoutePrefix = "summary";

        /// <summary>
        /// Endpoint to cancel a booking
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("customer")]
        [ProducesResponseType(typeof(CancellationResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancelBookingCustomerLed(
            [FromBody] BookingCancellationRequest bookingCancellationRequest, CancellationToken cancellationToken)
        {
            return await HandleCancellation(bookingCancellationRequest, BookingCancellationReason.CustomerLed, cancellationToken);
        }

        /// <summary>
        /// Endpoint to get a cancellation summary for a booking
        /// </summary>
        /// <param name="bookingCancellationSummaryRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        /// <exception cref="ApiException"></exception>
        [HttpPost]
        [Route($"{SummaryRoutePrefix}/customer")]
        [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancellationSummaryCustomerLed(
            [FromBody] BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            CancellationToken cancellationToken)
        {
            return await HandelCancellationSummary(bookingCancellationSummaryRequest, BookingCancellationReason.CustomerLed, cancellationToken);
        }
        
        /// <summary>
        /// Endpoint to cancel a booking with fee override
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        /// <exception cref="ApiException"></exception>
        [HttpPut]
        [Route("customer/override-fee")]
        [ProducesResponseType(typeof(CancellationExtendedResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancelBookingCustomerLedOverrideFee(
            [FromBody] BookingCancellationWithFeeOverrideRequest bookingCancellationRequest,
            CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRequest);
            var result = await bookingCancellationService.CancelBooking(bookingCancellationRequest,
                BookingCancellationReason.CustomerLed, bookingCancellationRequest.Fee, true, false, 
                cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Endpoint to cancel a booking with fee override
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        /// <exception cref="ApiException"></exception>
        [HttpPost]
        [Route($"{SummaryRoutePrefix}/customer/override-fee")]
        [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancellationSummaryCustomerLedOverrideFee(
            [FromBody] BookingCancellationSummaryWithFeeOverrideRequest bookingCancellationRequest,
            CancellationToken cancellationToken)
        {
            ArgumentNullException.ThrowIfNull(bookingCancellationRequest);
            var result = await bookingCancellationService.GetCancellationSummary(bookingCancellationRequest,
                BookingCancellationReason.CustomerLed, bookingCancellationRequest.Fee, true, false, 
                cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("easyjet")]
        [ProducesResponseType(typeof(CancellationExtendedResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancelBookingEasyjetLed(
            [FromBody] BookingCancellationRequest bookingCancellationRequest,
            CancellationToken cancellationToken)
        {
            return await HandleCancellation(bookingCancellationRequest, BookingCancellationReason.EasyJetLed,
                cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingCancellationSummaryRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPost]
        [Route($"{SummaryRoutePrefix}/easyjet")]
        [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancellationSummaryEasyjetLed(
            [FromBody] BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            CancellationToken cancellationToken)
        {
            return await HandelCancellationSummary(bookingCancellationSummaryRequest, BookingCancellationReason.EasyJetLed,
                cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingCancellationRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPut]
        [Route("trade")]
        [ProducesResponseType(typeof(CancellationExtendedResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancelBookingTradeLed(
            [FromBody] BookingCancellationRequest bookingCancellationRequest,
            CancellationToken cancellationToken)
        {
            return await HandleCancellation(bookingCancellationRequest, BookingCancellationReason.TradeLed,
                cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="bookingCancellationSummaryRequest"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        [HttpPost]
        [Route($"{SummaryRoutePrefix}/trade")]
        [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
        [NoCacheControl]
        public async Task<IActionResult> CancellationSummaryTrade(
            [FromBody] BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            CancellationToken cancellationToken)
        {
            return await HandelCancellationSummary(bookingCancellationSummaryRequest, BookingCancellationReason.TradeLed,
                cancellationToken);
        }

        private async Task<IActionResult> HandleCancellation(BookingCancellationRequest bookingCancellationRequest,
            BookingCancellationReason bookingCancellationReason,
            CancellationToken cancellationToken)
        {
            var result = await bookingCancellationService.CancelBooking(bookingCancellationRequest,
                bookingCancellationReason, null, true, false, 
                cancellationToken);
            return Ok(result);
        }

        private async Task<IActionResult> HandelCancellationSummary(
            BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
            BookingCancellationReason bookingCancellationReason,
            CancellationToken cancellationToken)
        {
            var result = await bookingCancellationService.GetCancellationSummary(bookingCancellationSummaryRequest,
                bookingCancellationReason, null, true, false, 
                cancellationToken);
            return Ok(result);
        }
    }
}
