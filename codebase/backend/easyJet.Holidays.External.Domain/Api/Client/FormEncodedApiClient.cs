using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Domain.Api.Client
{
    /// <summary>
    /// Json http client
    /// </summary>
    public class FormEncodedApiClient : BaseApiClient
    {
        public override string MediaType => "application/x-www-form-urlencoded";

        public FormEncodedApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}