using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SitecorePersonalize.Api;

/// <summary>
/// Sitecore personalize API client
/// </summary>
public class SitecorePersonalizeApiClient : JsonApiClient
{
    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="client">Http Client.</param>
    /// <param name="envSettings">Env settings.</param>
    public SitecorePersonalizeApiClient(
        HttpClient client,
        IOptions<EnvironmentBehaviourSettings> envSettings)
        : base(client, envSettings)
    {
    }
}