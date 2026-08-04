using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.TripAdvisor.Api
{
    /// <summary>
    /// TripAdvisor Api client
    /// </summary>
    public class TripAdvisorApiClient : JsonApiClient
    {
        public TripAdvisorApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}