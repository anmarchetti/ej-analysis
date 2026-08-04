using easyJet.Holidays.Api.Domain.Interfaces.Poi;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Provides resort related endpoints including retrieval of Points of Interest (POIs).
/// </summary>
[Route("resort")]
[ApiController]
[ApiVersion("1.0")]
public sealed class ResortController : ControllerBase
{
    private readonly IPoiService _poiService;

    /// <summary>
    /// Initializes a new instance of the <see cref="ResortController"/> class.
    /// </summary>
    /// <param name="poiService">Service for accessing POI data.</param>
    public ResortController(IPoiService poiService)
    {
        ArgumentNullException.ThrowIfNull(poiService);

        _poiService = poiService;
    }

    /// <summary>
    /// Returns ordered POI key groups and their items for the specified resort.
    /// </summary>
    /// <param name="resortId">Resort identifier.</param>
    /// <param name="categories">Comma separated list of keys to define ordering (optional).</param>
    /// <param name="lat"></param>
    /// <param name="lon"></param>
    /// <param name="airport"></param>
    /// <param name="theme"></param>
    /// <returns>Ordered collection of POI key groups with item details.</returns>
    [HttpGet]
    [Route("getpois")]
    public async Task<IActionResult> GetPoi([FromQuery] string resortId, [FromQuery] string categories, [FromQuery] double? lat, 
        [FromQuery] double? lon, [FromQuery] string airport, [FromQuery] string theme)
    {
        var result = await _poiService.GetPoiAsync(resortId, categories, lat, lon, airport, theme);
        return Ok(result); 
    }
}