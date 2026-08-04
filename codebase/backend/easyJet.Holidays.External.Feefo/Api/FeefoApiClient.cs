using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using easyJet.Holidays.External.Feefo.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Feefo.Api
{
    public class FeefoApiClient : BaseApiClient
    {
        private readonly FeefoAuthService _feefoAuthService;
        private readonly ILogger<FeefoApiClient> _logger;
        private const string AuthorizationHeaderName = "Authorization";

        public FeefoApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings,
            FeefoAuthService feefoAuthService, ILogger<FeefoApiClient> logger) : base(client, envSettings)
        {
            _feefoAuthService = feefoAuthService;
            _logger = logger;
        }

        public override async Task PrepareRequestMessage(HttpRequestMessage request)
        {
            var accessToken = await _feefoAuthService.GetToken();

            if (!string.IsNullOrEmpty(accessToken))
            {
                if (request?.Headers.Contains(AuthorizationHeaderName) ?? false)
                {
                    request.Headers.Remove(AuthorizationHeaderName);
                }

                request?.Headers.Add(AuthorizationHeaderName, $"Bearer {accessToken}");
            }

            await base.PrepareRequestMessage(request);
        }

        public override string MediaType => "application/x-www-form-urlencoded";
    }
}
