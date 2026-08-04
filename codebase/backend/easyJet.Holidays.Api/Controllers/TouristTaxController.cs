using easyJet.Holidays.External.Atcom.Services.TouristTax;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Provides tourist tax calculation endpoints.
/// </summary>
[Route("tourist-tax")]
[ApiController]
[ApiVersion("1.0")]
public sealed class TouristTaxController : ControllerBase
{
    private readonly ITouristTaxCalculator _touristTaxCalculator;

    /// <summary>
    /// Initializes a new instance of the <see cref="TouristTaxController"/> class.
    /// </summary>
    /// <param name="touristTaxCalculator">Service for calculating tourist tax.</param>
    public TouristTaxController(ITouristTaxCalculator touristTaxCalculator)
    {
        ArgumentNullException.ThrowIfNull(touristTaxCalculator);

        _touristTaxCalculator = touristTaxCalculator;
    }

    /// <summary>
    /// Calculates tourist tax based on the provided request details.
    /// </summary>
    /// <param name="touristTaxRequest"></param>
    /// <returns> </returns>
    [HttpPut]
    [Route("")]
    public async Task<IActionResult> CalculateTaxes([FromBody] TouristTaxRequest touristTaxRequest)
    {
        var result = await _touristTaxCalculator.CalculateTouristTax(touristTaxRequest);

        return Ok(result); 
    }
}