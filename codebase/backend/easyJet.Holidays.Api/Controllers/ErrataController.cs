using easyJet.Holidays.Api.Domain.Data.ErrataInfo;
using easyJet.Holidays.Api.Domain.Interfaces.ErrataInfo;
using easyJet.Holidays.Api.Domain.Services.Language;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Errata endpoints
/// </summary>
[Route("errata")]
[ApiController]
[ApiVersion("1.0")]
public class ErrataController : ControllerBase
{
    private readonly IErrataInfoService _errataInfoService;
    private readonly ILanguageService _languageService;

    public ErrataController(IErrataInfoService errataInfoService, ILanguageService languageService)
    {
        _errataInfoService = errataInfoService;
        _languageService = languageService;
    }

    /// <summary>
    /// Get accommodation errata messages
    /// </summary>
    /// <param name="request"></param>
    /// <returns>Errata messages list.</returns>
    [HttpGet]
    [Route("accom-errata")]
    [ProducesResponseType(typeof(IEnumerable<string>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetAccomErrataInfo([FromQuery] AccomErrataInfoRequest request)
    {
        var languageCode = _languageService.GetCurrentLanguage();
        var result = await _errataInfoService.GetErrataInfo(languageCode, request.OfferDate, request.Codes);
        return Ok(result);
    }
}