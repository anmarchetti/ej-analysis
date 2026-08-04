using easyJet.Holidays.External.Data8.Ancillaries;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Endpoints for address search and retrieval.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AddressLookupController"/> class.
/// </remarks>
/// <param name="addressLookupService">Address lookup service.</param>
[Route("address-lookup")]
[ApiController]
[ApiVersion("1.0")]
public class AddressLookupController(IAddressLookupService addressLookupService) : ControllerBase
{
    private readonly IAddressLookupService _addressLookupService = addressLookupService;

    /// <summary>
    /// Searches for address suggestions by free text input.
    /// </summary>
    /// <param name="addressToFind">Address text entered by the user.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>A list of matching address suggestions.</returns>
    [HttpGet]
    public async Task<IActionResult> Get(string addressToFind, string countryCode, CancellationToken cancellationToken)
    {
        var addresses = await _addressLookupService.LookupAddress(addressToFind, countryCode, cancellationToken);
        return Ok(addresses);
    }

    /// <summary>
    /// Retrieves full address details by Data8 value identifier.
    /// </summary>
    /// <param name="value">Data8 identifier.</param>
    /// <param name="countryCode"></param>
    /// <param name="cancellationToken">Request cancellation token.</param>
    /// <returns>Resolved address details.</returns>
    [HttpGet("retrieve")]
    public async Task<IActionResult> Retrieve(string value, string countryCode, CancellationToken cancellationToken)
    {
        var address = await _addressLookupService.RetrieveAddress(value, countryCode, cancellationToken);
        return Ok(address);
    }
}
