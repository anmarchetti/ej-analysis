using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Apollo.Api;

/// <summary>
/// Represents the API client for interacting with the Apollo service.
/// Inherits functionality from <see cref="JsonApiClient"/>, providing core behavior for JSON-based communication.
/// </summary>
public class ApolloApiClient : JsonApiClient
{
    /// <summary>
    /// Represents an API client for communication with the Apollo service.
    /// </summary>
    /// <remarks>
    /// This class extends the <see cref="JsonApiClient"/> to provide specific functionality
    /// tailored for the Apollo service, which enables JSON-based API interactions.
    /// </remarks>
    public ApolloApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings)
        : base(client, envSettings)
    {
    }
}
