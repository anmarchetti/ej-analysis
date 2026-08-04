using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Ccp.Api
{
    /// <summary>
    /// Represents a client for interacting with the CCP API, extending functionality from the JsonApiClient.
    /// Provides API-specific configuration and overrides for request preparation.
    /// </summary>
    public class CcpApiClient : JsonApiClient
    {
        /// <summary>
        /// Contains configuration settings for the CCP API client, including the API URL and authentication details.
        /// </summary>
        private readonly CcpSettings _ccpSettings;

        /// <summary>
        /// Represents the CCP API client, extending the functionality of the JsonApiClient to handle
        /// specific operations for interacting with the CCP service. It includes configuration for
        /// API settings and custom request preparation with additional headers.
        /// </summary>
        public CcpApiClient(HttpClient client, IOptions<CcpSettings> ccpSettings, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
            _ccpSettings = ccpSettings?.Value ?? throw new ArgumentNullException(nameof(ccpSettings));
        }

        /// <summary>
        /// Prepares the HTTP request message by adding necessary headers and configurations.
        /// </summary>
        /// <param name="request">The HTTP request message to be prepared.</param>
        /// <returns>A task representing the asynchronous operation of preparing the request message.</returns>
        public override Task PrepareRequestMessage(HttpRequestMessage? request)
        {
            // Add API key header
            request?.Headers.Add("x-api-key", _ccpSettings.ApiKey);
            
            return base.PrepareRequestMessage(request);
        }
    }
}