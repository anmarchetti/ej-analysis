using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Google.Api
{
    public class GoogleApiService : ApiService
    {
        private readonly GoogleSettings _googleSettings;

        public GoogleApiService(GoogleApiClient apiClient, IOptions<GoogleSettings> googleSettings) : base(apiClient)
        {
            _googleSettings = googleSettings.Value ?? throw new ArgumentNullException(nameof(googleSettings));
        }

        /// <inheritdoc />
        public override string Name() => "Google API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _googleSettings.TimeoutMilliSeconds;
        }
    }
}