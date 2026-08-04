using easyJet.Holidays.Api.Domain.Data.RecommendedDestination;
using easyJet.Holidays.Api.Domain.Interfaces.HolidayInspiration;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Holiday inspiration controller
/// </summary>
[Route("holiday-inspiration")]
[ApiController]
[ApiVersion("1.0")]
public class HolidayInspirationController : ControllerBase
{
    private readonly IHolidayInspirationSevice _holidayInspirationSevice;

    public HolidayInspirationController(IHolidayInspirationSevice holidayInspirationSevice)
    {
        _holidayInspirationSevice = holidayInspirationSevice;
    }

    /// <summary>
    /// Get recommended destination based on the passed criteria.
    /// </summary>
    /// <param name="request">User answer.</param>
    /// <returns>Collection of recommended destinations.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(RecommendedDestinationResponse), (int)HttpStatusCode.OK)]
    [Route("recommended")]
    public async Task<IActionResult> RecommendedDestinations(RecommendedDestinationsRequest request)
    {
        var res = await _holidayInspirationSevice.GetRecommendedDestinations(request);

        return Ok(res);
    }

    /// <summary>
    /// Validate users answers.
    /// </summary>
    /// <param name="request">User answer.</param>
    /// <returns>Collection of recommended questions based on user's answers.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(RecommendedQuestions), (int)HttpStatusCode.OK)]
    [Route("validate-answers")]
    public async Task<IActionResult> ValidateAnswers([FromQuery] ValidateRecommendedRequest request)
    {
        var res = await _holidayInspirationSevice.ValidateAnswers(request);

        return Ok(res);
    }
}
