using easyJet.Holidays.Api.Domain.Interfaces.Weather;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers;

[Route("weather")]
[ApiController]
[ApiVersion("1.0")]
public class WeatherController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public WeatherController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    [Route("region")]
    public async Task<IActionResult> GetWeatherForRegion([FromQuery] string code)
    {
        var res = await _weatherService.GetWeatherForRegion(code);

        if (res is null)
        {
            return NotFound("Weather for region not found");
        }

        return Ok(res);
    }
}
