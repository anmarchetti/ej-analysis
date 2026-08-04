using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using easyJet.Holidays.External.Salesforce.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Salesforce.Api
{
    public class SalesforceApiClient : BaseApiClient
    {
        private readonly SalesforceAuthService _salesforceAuthService;
        private const string AuthorizationHeaderName = "Authorization";

        public SalesforceApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings,
            SalesforceAuthService SalesforceAuthService) : base(client, envSettings)
        {
            _salesforceAuthService = SalesforceAuthService;
        }

        public override async Task PrepareRequestMessage(HttpRequestMessage request)
        {
            var accessToken = await _salesforceAuthService.GetToken();

            if (!string.IsNullOrEmpty(accessToken))
            {
                if (request.Headers.Contains(AuthorizationHeaderName))
                {
                    request.Headers.Remove(AuthorizationHeaderName);
                }

                request.Headers.Add(AuthorizationHeaderName, $"Bearer {accessToken}");
            }

            await base.PrepareRequestMessage(request);
        }

        public override string MediaType => "application/json";
    }
}
