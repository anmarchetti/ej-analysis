using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.DatahubSync.Api.Atcom;

/// <summary>
/// SOAP client for interacting with the Atcom API, extending functionality from XmlApiClient.
/// </summary>
public class AtcomApiClient : XmlApiClient
{
    /// <summary>
    /// Represents a specialized API client for interacting with the Atcom SOAP service.
    /// Inherits functionality from the XmlApiClient to send XML-based HTTP requests.
    /// </summary>
    public AtcomApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
    {
    }
}