using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Musement.Api
{
    /// <summary>
    /// Musement api service
    /// </summary>
    public class MusementApiService : ApiService
    {
        private readonly MusementSettings _musementSettings;

        public MusementApiService(MusementApiClient apiClient, IOptions<MusementSettings> musementSettings) : base(apiClient)
        {
            _musementSettings = musementSettings.Value ?? throw new ArgumentNullException(nameof(musementSettings));
        }

        /// <inheritdoc />
        public override string Name() => "Musement API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _musementSettings.Api.TimeoutMilliSeconds;
        }
    }
}
