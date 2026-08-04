using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Apollo.Api;

/// <summary>
/// Represents the Apollo API service, a specialized implementation of the ApiService class
/// which facilitates communication with the Decision Personalize API using the Apollo client and settings.
/// </summary>
public class ApolloApiService : ApiService
{
    private readonly ApolloSettings _settings;

    /// <summary>
    /// Represents a service implementation for interacting with the Decision Personalize API.
    /// This class extends the ApiService base class and is tailored for use with the Apollo client
    /// and specific settings defined in ApolloSettings.
    /// </summary>
    public ApolloApiService(ApolloApiClient apiClient, IOptions<ApolloSettings> settings)
        : base(apiClient)
    {
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
    }

    /// <summary>
    /// Gets the name of the API service.
    /// This property specifies the name as "Decision Personalize API service."
    /// </summary>
    /// <returns>A string representing the name of the API service.</returns>
    public override string Name() => "Decision Personalize API service.";

    /// <summary>
    /// Gets the default timeout value for Apollo API requests in milliseconds.
    /// This value is retrieved from the ApolloSettings configuration.
    /// </summary>
    /// <returns>
    /// An integer representing the configured timeout duration in milliseconds.
    /// </returns>
    public override int DefaultTimeoutMilliSeconds() => _settings.TimeoutMilliSeconds;
}
