using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Musement.Api
{
    /// <summary>
    /// Musement api client for sending requests via musement auth api service
    /// </summary>
    public class MusementAuthApiClient : JsonApiClient
    {
        private readonly MusementSettings _musementSettings;

        public MusementAuthApiClient(
            HttpClient client,
            IOptions<EnvironmentBehaviourSettings> envSettings,
            IOptions<MusementSettings> musementSettings
            )
            : base(client, envSettings)
        {
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
        }

        /// <inheritdoc />
        public override Task PrepareRequestMessage(HttpRequestMessage request)
        {
            if (_musementSettings?.AuthHeaders?.Keys.FirstOrDefault() != null)
            {
                foreach (var header in _musementSettings?.Headers)
                {
                    if (!string.IsNullOrWhiteSpace(header.Key) && !string.IsNullOrWhiteSpace(header.Value))
                    {
                        request?.Headers?.Add(header.Key, header.Value);
                    }
                }
            }

            return base.PrepareRequestMessage(request);
        }
    }
}
