using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.Api.Domain.Services.Offers;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Requested pricing models
/// </summary>
[Route("requested-price")]
[ApiController]
[ApiVersion("1.0")]
public class RequestedPriceController : Controller
{
    private readonly IRequestedPriceService _requestedPriceService;
    private readonly IPricesService _priceService;


    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="requestedPriceService"></param>
    /// <param name="priceService"></param>
    public RequestedPriceController(IRequestedPriceService requestedPriceService, IPricesService priceService)
    {
        _requestedPriceService = requestedPriceService;
        _priceService = priceService;
    }

    /// <summary>
    /// Get requested price for specified keys
    /// </summary>
    /// <param name="key">Collection of comma separated keys. Key structure: [GeographyCode].[Search name]. Search name is optional part</param>
    /// <param name="round"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    [ProducesResponseType(typeof(IEnumerable<RequestedPriceSummaryModel>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> Get([Required] string key, bool round)
    {
        var keys = key.Split(',');
        var response = await _requestedPriceService.GetPrice(keys);

        if (round)
        {
            _priceService.RoundPrice(response.ToList());
        }

        return Ok(response);
    }
}