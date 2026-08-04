using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using easyJet.Holidays.External.Verint.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace easyJet.Holidays.External.Verint.Api
{
    public class VerintApiClient : JsonApiClient
    {
        private readonly HttpClient _client;
        private readonly IOptions<EnvironmentBehaviourSettings> _envSettings;
        private readonly VerintAuthService _verintAuthService;
        private readonly ILogger<VerintApiClient> _logger;

        public VerintApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings, VerintAuthService verintAuthService, ILogger<VerintApiClient> logger) : base(client, envSettings)
        {
            _client = client;
            _envSettings = envSettings;
            _verintAuthService = verintAuthService;
            _logger = logger;
        }

        public override async Task PrepareRequestMessage(HttpRequestMessage request)
        {
            var accessToken = await _verintAuthService.GetToken();

            if (!string.IsNullOrEmpty(accessToken))
            {
                request?.Headers.Add("Authorization", $"OIDC_id_token {accessToken}");
            }

            try
            {
                _logger.LogDebug($"{nameof(VerintApiClient)} {nameof(PrepareRequestMessage)} {JsonConvert.SerializeObject(request)}");
            }
            catch (Exception)
            {
                // ignored
            }

            await base.PrepareRequestMessage(request);
        }
    }
}