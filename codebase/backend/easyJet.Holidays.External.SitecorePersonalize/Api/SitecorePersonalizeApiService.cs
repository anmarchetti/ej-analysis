using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SitecorePersonalize.Api;

/// <summary>
/// A specialized API service for interacting with Sitecore Personalize endpoints.
/// Inherits common API service functionality from the ApiService base class.
/// </summary>
public class SitecorePersonalizeApiService : ApiService
{
    private readonly SitecorePersonalizeSettings _settings;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="apiClient"></param>
    /// <param name="settings"></param>
    public SitecorePersonalizeApiService(SitecorePersonalizeApiClient apiClient, IOptions<SitecorePersonalizeSettings> settings)
        : base(apiClient)
    {
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
    }
    
    /// <inheritdoc />
    public override string Name() => "Sitecore Personalize API service.";

    /// <inheritdoc />
    public override int DefaultTimeoutMilliSeconds()
    {
        return _settings.TimeoutMilliSeconds;
    }
}