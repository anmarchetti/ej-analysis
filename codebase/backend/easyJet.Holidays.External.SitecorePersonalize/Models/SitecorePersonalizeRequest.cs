using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.SitecorePersonalize.Models;

/// <summary>
/// Sitecore personalize request
/// </summary>
public class SitecorePersonalizeRequest : JsonApiRequest<SitecorePersonalizeRequestBody>
{
    /// <summary>
    /// Method
    /// </summary>
    public override HttpMethod Method => HttpMethod.Post;
}