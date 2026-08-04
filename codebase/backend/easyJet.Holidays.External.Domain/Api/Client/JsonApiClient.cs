using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    /// <summary>
    /// Json http client
    /// </summary>
    public class JsonApiClient : BaseApiClient
    {
        public override string MediaType => "application/json";

        public JsonApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}