using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers;

[ExcludeFromCodeCoverage]
[ApiController]
[Route("[controller]")]
public class BookingCancellationController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingCancellationController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpPost]
    [Route("customer-led-summary")]
    public async Task<IActionResult> CancellationCustomerLedSummary(BookingCancellationSummaryRequest request)
    {
        var result = await _bookingService.CancellationCustomerLedSummary(request);

        return Ok(result);
    }

    [HttpPut]
    [Route("customer-led-cancel-booking-override-fee")]
    public async Task<IActionResult> CancellationCustomerLedCancelBookingOverrideFee(
        BookingCancellationWithFeeOverrideRequest request)
    {
        var result = await _bookingService.CancelBookingCustomerLedOverrideFee(request);

        return Ok(result);
    }
}