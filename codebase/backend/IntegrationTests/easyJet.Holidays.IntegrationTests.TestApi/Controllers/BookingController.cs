using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.Authentication.Agent;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.TradePortal;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers;

[ApiController]
[Route("[controller]")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ITradePortalAccountService _tradePortalAccountService;

    public BookingController(IBookingService bookingService, ITradePortalAccountService tradePortalAccountService)
    {
        _bookingService = bookingService;
        _tradePortalAccountService = tradePortalAccountService;
    }

    [Obsolete]
    [HttpPost]
    [Route("create-booking")]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var result = await _bookingService.CreateBooking(request);

        return Ok(result);
    }

    [HttpPost]
    [Route("random-booking")]
    [SuppressMessage("Security", "CA5394:Do not use insecure randomness", Justification = "Don't need secure random for booking duration")]
    public async Task<IActionResult> CreateRandomBooking([FromBody] CreateBookingRequest request)
    {
        if (request == null)
        {
            return BadRequest("Request cannot be null");
        }

        if (request.NumberOfBookings > 1)
        {
            return BadRequest("Cannot create multiple bookings");
        }

        if (request.BookingCreationParams.Duration == 0)
            request.BookingCreationParams.Duration = Random.Shared.Next(7, 14);

        var result = await _bookingService.CreateRandomBooking(request);

        if (result.Bookings.Any())
        {
            var singleBookingResponse = new CreateBookingResponse
            {
                BookingResponse = result.Bookings[0],
                CustomerCredentials = result.CustomerCredentials,
                Customer = result.Customer,
            };

            return Ok(singleBookingResponse);
        }

        return BadRequest(result.Attempts);
    }

    [HttpPost]
    [Route("booking-with-alt-rooms")]
    public async Task<IActionResult> CreateBookingWithAltRooms([FromBody] CreateBookingRequest request)
    {
        var result = await _bookingService.CreateBookingWithRoom(request);

        return Ok(result);
    }

    [HttpPost]
    [Route("canceled-with-credit-booking")]
    public async Task<IActionResult> CreateCancelledWithCreditBooking()
    {
        var result = await _bookingService.CreateCancelledWithCreditBooking();

        return Ok(result);
    }

    [HttpPost]
    [Route("canceled-booking")]
    public async Task<IActionResult> CreateCancelledBooking()
    {
        var result = await _bookingService.CreateCancelledBooking();

        return Ok(result);
    }

    [HttpPost]
    [Route("deposit-only-booking")]
    public async Task<IActionResult> CreateDepositOnlyBooking()
    {
        var result = await _bookingService.CreateDepositOnlyBooking();

        return Ok(result);
    }


    [HttpGet]
    [Route("get-booking")]
    public async Task<IActionResult> GetBooking([FromQuery] DisplayBookingRequest request)
    {
        var result = await _bookingService.GetBooking(request);

        return Ok(result);
    }

    [HttpGet]
    [Route("health-check")]
    public async Task<IActionResult> HealthCheck()
    {
        return Ok();
    }

    [HttpPost]
    [Route("pay-remaining-balance")]
    public async Task<IActionResult> PayRemainingBalance([FromBody] PayRemainingBalanceRequest request)
    {
        var result = await _bookingService.PayRemainingBalance(request);

        return Ok(result);
    }
}