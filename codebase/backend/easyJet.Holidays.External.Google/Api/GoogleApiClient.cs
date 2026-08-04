using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Google.Api
{
    /// <summary>
    /// Sitecore http client to sendXML requests
    /// </summary>
    public class GoogleApiClient : JsonApiClient
    {
        public GoogleApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}