using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Musement.Api
{
    /// <summary>
    /// Musement api service for getting access tokens to musement service
    /// </summary>
    public class MusementAuthApiService : ApiService
    {
        private readonly MusementSettings _musementSettings;

        public MusementAuthApiService(MusementAuthApiClient apiClient, IOptions<MusementSettings> musementSettings) : base(apiClient)
        {
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
        }

        /// <inheritdoc />
        public override string Name() => "Musement Access Api service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _musementSettings.Api.TimeoutMilliSeconds;
        }
    }
}
