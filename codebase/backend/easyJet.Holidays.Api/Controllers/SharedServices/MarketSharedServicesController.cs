using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.SharedServices;

[Route("shared-services/market")]
[ApiVersion("1.0")]
[ServiceFilter(typeof(DisableValidationAttribute))]
[ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
[ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
public class MarketSharedServicesController : ControllerBase
{
    private readonly IMarketService _marketService;

    public MarketSharedServicesController(IMarketService marketService)
    {
        _marketService = marketService;
    }

    [HttpGet]
    [Route("validate-currency")]
    [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> IsValidCurrency([FromQuery] string currencyCode)
    {
        var validationResult = _marketService.IsValidCurrency(currencyCode);

        return Ok(validationResult);
    }
}