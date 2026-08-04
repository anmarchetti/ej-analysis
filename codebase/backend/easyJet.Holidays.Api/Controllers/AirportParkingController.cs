using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Interfaces.AirportParking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Api in charge of handling bookings to airport parking.
/// </summary>
[Route("airport-parking")]
[ApiController]
[ApiVersion("1.0")]
public class AirportParkingController : ControllerBase
{
    private readonly IAirportParkingService _airportParkingService;
    private readonly IReferenceDataService _referenceDataService;

    /// <inheritdoc />
    public AirportParkingController(IAirportParkingService airportParkingService, IReferenceDataService referenceDataService)
    {
        _airportParkingService = airportParkingService;
        _referenceDataService = referenceDataService;
    }

    /// <summary>
    /// Get all available airport parking for the given booking
    /// </summary>
    /// <returns>Airport Parking details</returns>
    /// <response code="200">Successful request</response>
    /// <response code="400">Bad request: no airport parking details</response>
    /// <response code="503">Internal server error</response>
    [HttpPost]
    [Route("search")]
    [ProducesResponseType(typeof(AirportParkingResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> Search([FromBody] AirportParkingSearchRequest request)
    {
        ExternalExtrasSettings settings = await _referenceDataService.GetExternalExtrasSettings();

        if (!settings.IsExternalExtrasEnabled)
            return NotFound();

        if (request == null)
            return BadRequest($"Expected {nameof(AirportParkingSearchRequest)} but received Null value.");

        AirportParkingResponse response = await _airportParkingService.Search(request.Offer);

        return Ok(response);
    }
}