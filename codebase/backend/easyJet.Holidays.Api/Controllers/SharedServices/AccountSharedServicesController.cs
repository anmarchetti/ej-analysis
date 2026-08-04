using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Filters;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using System.Net;

namespace easyJet.Holidays.Api.Controllers.SharedServices;

/// <summary>
/// 
/// </summary>
[Route("shared-services/account")]
[ApiVersion("1.0")]
[ServiceFilter(typeof(DisableValidationAttribute))]
[ServiceFilter(typeof(UseSerializerWithFullConverterForOutputAttribute))]
[ServiceFilter(typeof(SharedServicesAuthorizedAttribute))]
public class AccountSharedServicesController(ICustomerIdentifierProvider customerIdentifierProvider) : ControllerBase
{
    /// <summary>
    /// Customer identifiers
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="401">Customer is no authorized</response>
    /// <response code="503">Unexpected error</response>
    [HttpGet]
    [Route("customer-identifiers")]
    [ProducesResponseType(typeof(CustomerIdentifiers), (int)HttpStatusCode.OK)]
    [ServiceFilter(typeof(CustomerAuthorizedAttribute))]
    public async Task<IActionResult> CustomerIdentifiers()
    {
        try
        {
            // Unauthorised logic implemented in attribute
            var customerIdentifiers = await customerIdentifierProvider.CustomerIdentifiers();
            return Ok(customerIdentifiers);
        }
        catch (Exception ex)
        {
            // Wrap in ApiException to get nice 401 response
            throw new ApiException(ApiExceptionCodes.AuthCustomerDetailsError, null, null, ex,
                HttpStatusCode.InternalServerError);
        }
    }
}