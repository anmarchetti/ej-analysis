using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SitecorePersonalize.Models;

/// <summary>
/// Sitecore personalize response
/// </summary>
public class SitecorePersonalizeFilterOrderingResponse : JsonApiResponse<SitecorePersonalizeFilterOrderingResponseBody>
{
    /// <summary>
    /// Gets an array of API errors encountered during the execution of a request.
    /// These errors represent issues that occurred in downstream systems or during the operation of the API.
    /// </summary>
    public override ApiError[] ApiErrors => [];
}