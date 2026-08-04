using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;

namespace easyJet.Holidays.External.B2B.Api
{
    /// <summary>
    /// Sitecore http client to sendXML requests
    /// </summary>
    public class B2BApiClient : XmlApiClient
    {
        private readonly B2BSettings _b2bSettings;

        public B2BApiClient(HttpClient client, IOptions<B2BSettings> b2bSettings, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
            _b2bSettings = b2bSettings.Value ?? throw new ArgumentNullException(nameof(b2bSettings));
        }

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            // All B2B requests should have authorization header
            request.Headers.Authorization = new AuthenticationHeaderValue(
                "Basic",
                Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_b2bSettings.ServiceUsername}:{_b2bSettings.ServicePassword}"))
            );

            return base.PrepareRequestMessage(request);
        }
    }
}