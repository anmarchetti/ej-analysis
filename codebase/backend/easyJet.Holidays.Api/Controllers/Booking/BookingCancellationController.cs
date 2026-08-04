using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

#nullable enable


namespace easyJet.Holidays.Api.Controllers.Booking;

/// <summary>
/// Booking cancellation controller
/// </summary>
/// <remarks>
/// Constructor
/// </remarks>
/// <param name="bookingCancellationService"></param>
/// <param name="infoCancellationService"></param>
/// <param name="authenticationService"></param>
[Route("booking/cancellation")]
[ApiController]
[ApiVersion("1.0")]
#pragma warning disable S6960
public class BookingCancellationController(
#pragma warning restore S6960
    IBookingCancellationService bookingCancellationService,
    IInfoCancellationService infoCancellationService,
    IAuthenticationService authenticationService
) : ControllerBase
{
    /// <summary>
    /// Endpoint to cancel a booking
    /// </summary>
    /// <param name="bookingCancellationRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPut]
    [Route("customer")]
    [ProducesResponseType(typeof(CancellationResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> CancelBookingCustomerLed(
        [FromBody] BookingCancellationRequest bookingCancellationRequest, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(bookingCancellationRequest);
        bookingCancellationRequest.Reason ??= CancellationReason.CustomerCancellation;
        await authenticationService.CheckIfSignedInAccountIsLocked(true);
        var result = await bookingCancellationService.CancelBooking(bookingCancellationRequest,
            BookingCancellationReason.CustomerLed, null, false, false, 
            cancellationToken);

        var minimalResult = new CancellationResponse()
        {
            CashRefundAmount = result.CashRefundAmount,
            CreditRefundAmount = result.CreditRefundAmount,
            BookingReference = result.BookingReference
        };

        return Ok(minimalResult);
    }

    /// <summary>
    /// Endpoint to get a cancellation summary for a booking
    /// </summary>
    /// <param name="bookingCancellationSummaryRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    [HttpPost]
    [Route($"summary/customer")]
    [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> CancellationSummaryCustomerLed(
        [FromBody] BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
        CancellationToken cancellationToken)
    {
        await authenticationService.CheckIfSignedInAccountIsLocked(true);
        var result = await bookingCancellationService.GetCancellationSummary(bookingCancellationSummaryRequest,
            BookingCancellationReason.CustomerLed, null, false, false, cancellationToken);
        return Ok(result);
    }
    
    /// <summary>
    /// Endpoint to cancel a booking
    /// </summary>
    /// <param name="bookingCancellationRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPut]
    [Route("trade")]
    [ProducesResponseType(typeof(CancellationResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> CancelBookingTradeLed(
        [FromBody] BookingCancellationRequest bookingCancellationRequest, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(bookingCancellationRequest);
        bookingCancellationRequest.Reason ??= CancellationReason.CustomerCancellation;
        await authenticationService.CheckIfSignedInAccountIsLocked(true);
        var result = await bookingCancellationService.CancelBooking(bookingCancellationRequest,
            BookingCancellationReason.TradeLed, null, false, true, 
            cancellationToken);

        var minimalResult = new CancellationResponse()
        {
            CashRefundAmount = result.CashRefundAmount,
            CreditRefundAmount = result.CreditRefundAmount,
            BookingReference = result.BookingReference
        };

        return Ok(minimalResult);
    }

    /// <summary>
    /// Endpoint to get a cancellation summary for a booking
    /// </summary>
    /// <param name="bookingCancellationSummaryRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    [HttpPost]
    [Route($"summary/trade")]
    [ProducesResponseType(typeof(CancellationSummaryResponse), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> CancellationSummaryTradeLed(
        [FromBody] BookingCancellationSummaryRequest bookingCancellationSummaryRequest,
        CancellationToken cancellationToken)
    {
        await authenticationService.CheckIfSignedInAccountIsLocked(true);
        var result = await bookingCancellationService.GetCancellationSummary(bookingCancellationSummaryRequest,
            BookingCancellationReason.TradeLed, null, false, true, cancellationToken);
        return Ok(result);
    }
    
    /// <summary>
    /// 
    /// </summary>
    /// <param name="bookingReference"></param>
    /// <param name="marketCode"></param>
    /// <param name="language"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("test/{bookingReference}")]
    [ServiceFilter(typeof(ApiAuthAttribute))]
    [NoCacheControl]
    public async Task<IActionResult> GetCancellation(string bookingReference, string marketCode, string language)
    {
        return Ok(await infoCancellationService.GetInfoCancellationAsync(new BookingResponse()
        {
            BookingReference = bookingReference, Language = language, MarketCode = marketCode
        }));
    }
}