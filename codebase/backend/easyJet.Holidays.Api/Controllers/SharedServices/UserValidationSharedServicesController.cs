using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Interfaces.UserValidation;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.SharedServices;

/// <summary>
/// Atcom Authentication Shared Service Controller
/// </summary>
/// <remarks>
/// Constructor
/// </remarks>
[Route("shared-services/user-validation")]
[ApiVersion("1.0")]
[ServiceFilter(typeof(DisableValidationAttribute))]
[ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
[ApiController]
[ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
public class UserValidationSharedServicesController(IUserValidationService userValidationService) : ControllerBase
{
    /// <summary>
    /// Endpoint to get a cancellation summary for a booking
    /// </summary>
    /// <param name="userValidationRequest"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="ApiException"></exception>
    [HttpPost]
    [Route("")]
    [ProducesResponseType(typeof(UserValidationResponse), (int)HttpStatusCode.OK)]
    [NoCacheControl]
    public async Task<IActionResult> IsValid(
        [FromBody] UserValidationRequest userValidationRequest,
        CancellationToken cancellationToken)
    {
        var result = await userValidationService.IsUserValid(userValidationRequest);
        return Ok(result);
    }
}