using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.HolidayExtras.Api
{
    /// <inheritdoc />
    public class HolidayExtrasApiClient : JsonApiClient
    {
        /// <inheritdoc />
        public HolidayExtrasApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }
    }
}