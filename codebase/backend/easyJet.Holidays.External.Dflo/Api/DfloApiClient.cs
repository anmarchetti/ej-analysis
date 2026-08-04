using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;

namespace easyJet.Holidays.External.Dflo.Api
{
    /// <summary>
    /// Sitecore http client to sendXML requests
    /// </summary>
    public class DfloApiClient : JsonApiClient
    {
        private readonly DfloSettings _dfloSettings;

        public DfloApiClient(HttpClient client, IOptions<DfloSettings> dfloSettings, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
            _dfloSettings = dfloSettings.Value ?? throw new ArgumentNullException(nameof(dfloSettings));
        }

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_dfloSettings.Login}:{_dfloSettings.Password}"))
            );

            return base.PrepareRequestMessage(request);
        }
    }
}