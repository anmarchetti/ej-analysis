using Asp.Versioning;
using easyJet.Holidays.Api.Domain.Interfaces.Aws;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Filters;
using easyJet.Holidays.External.Apollo.Services;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.Api.Controllers;

/// <summary>
/// Controller for managing operations related to Apollo bookings.
/// </summary>
/// <remarks>
/// This controller provides endpoints for retrieving booking information from the Apollo system,
/// either by customer mapped ID or by reference IDs.
/// It requires authentication and authorization for access to its endpoints.
/// </remarks>
[Route("apollo")]
[ApiController]
[ApiVersion("1.0")]
public class ApolloController : Controller
{
    private readonly IApolloService _apolloService;
    private readonly ICustomerIdentifierProvider _customerIdentifierProvider;

    /// <summary>
    /// Controller to manage operations related to Apollo bookings.
    /// </summary>
    /// <remarks>
    /// This controller provides endpoints to interact with Apollo bookings, such as fetching bookings by customer mapped ID or reference IDs.
    /// </remarks>
    public ApolloController(
        IApolloService apolloService,
        ICustomerIdentifierProvider customerIdentifierProvider)
    {
        _apolloService = apolloService;
        _customerIdentifierProvider = customerIdentifierProvider;
    }
    
    /// <summary>
    /// Refresh reference data cache
    /// </summary>
    /// <returns></returns>
    /// <response code="200">Ok</response>
    /// <response code="503">Internal server error</response>
    [HttpGet]
    [Route("get-upcoming-bookings")]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    public async Task<IActionResult> GetBookingsByCustomerId()
    {
        var customerIdentifiers = await _customerIdentifierProvider.CustomerIdentifiers();

        if (string.IsNullOrWhiteSpace(customerIdentifiers.Id))
        {
            return BadRequest("Couldn't get customer ID.");
        }
        
        var result = await _apolloService.GetUpcomingBookingsByEncryptedMemberId(customerIdentifiers.Id);
        return Json(result);
    }
}
