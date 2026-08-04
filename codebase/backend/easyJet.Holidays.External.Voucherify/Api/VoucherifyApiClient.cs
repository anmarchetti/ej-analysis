using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Voucherify.Api
{
    /// <summary>
    /// Http client
    /// </summary>
    public class VoucherifyApiClient : JsonApiClient
    {
        private readonly VoucherifySettings _settings;

        public VoucherifyApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings, IOptions<VoucherifySettings> settings) : base(client, envSettings)
        {
            _settings = settings.Value ?? throw new ArgumentNullException(nameof(settings));
        }

        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            request.Headers.Add("X-App-Id", _settings.ApplicationId);
            request.Headers.Add("X-App-Token", _settings.SecretKey);

            return base.PrepareRequestMessage(request);
        }
    }
}