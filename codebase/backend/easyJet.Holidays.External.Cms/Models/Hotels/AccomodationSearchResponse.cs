using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels;
/// <summary>
/// AccomodationSearchResponse
/// </summary>
public class AccomodationSearchResponse : JsonApiResponse<Dictionary<string, HashSet<string>>>
{
    /// <inheritdoc/>
    public override ApiError[] ApiErrors => Array.Empty<ApiError>(); // Don't handle response body errors
}


