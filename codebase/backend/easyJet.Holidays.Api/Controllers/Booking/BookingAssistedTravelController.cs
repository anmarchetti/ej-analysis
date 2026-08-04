using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers.Booking;

/// <summary>
/// Booking assisted travel controller.
/// </summary>
[Route("booking/{bookingReference}/assisted-travel")]
[ApiController]
[ApiVersion("1.0")]
[ServiceFilter(typeof(TradeAgentOrCustomerAuthorizedAttribute))]
public class BookingAssistedTravelController(ISalesforceService salesforceService) : ControllerBase
{
    /// <summary>
    /// Gets assisted travel requests for a booking reference.
    /// </summary>
    /// <param name="bookingReference">Booking reference.</param>
    /// <returns>Assisted travel case details including passenger-level data.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(AssistedTravelResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [NoCacheControl]
    public async Task<ActionResult<AssistedTravelResult>> GetAssistedTravelRequests(string bookingReference)
    {
        if (string.IsNullOrWhiteSpace(bookingReference))
        {
            return BadRequest("Booking reference cannot be null or empty.");
        }

        var result = await salesforceService.GetAssistedTravelRequests(bookingReference);
        return Ok(result);
    }

    /// <summary>
    /// Submits assisted travel requests for a booking.
    /// </summary>
    /// <param name="bookingReference">Booking reference.</param>
    /// <param name="request">Assisted travel request payload.</param>
    /// <returns>Submission result.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(AssistedTravelSubmissionResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [NoCacheControl]
    public async Task<ActionResult<AssistedTravelSubmissionResult>> SubmitAssistedTravelRequests(
        string bookingReference,
        [FromBody] AssistedTravelSubmissionRequest request)
    {
        if (string.IsNullOrWhiteSpace(bookingReference))
        {
            return BadRequest("Booking reference cannot be null or empty.");
        }

        if (request is null || request.Passengers.Count == 0)
        {
            return BadRequest("At least one passenger with questions is required.");
        }

        var result = await salesforceService.SubmitAssistedTravelRequests(bookingReference, request);
        return Ok(result);
    }
}

