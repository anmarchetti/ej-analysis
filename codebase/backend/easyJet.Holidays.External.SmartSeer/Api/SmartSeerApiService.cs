using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.SmartSeer.Api
{
    public class SmartSeerApiService : ApiService
    {
        private readonly SmartSeerSettings _smartSeerSettings;

        public SmartSeerApiService(SmartSeerApiClient apiClient, IOptions<SmartSeerSettings> smartSeerSettings) : base(apiClient)
        {
            _smartSeerSettings = smartSeerSettings.Value ?? throw new ArgumentNullException(nameof(smartSeerSettings));
        }

        /// <inheritdoc />
        public override string Name() => "SmartSeer API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _smartSeerSettings.TimeoutMilliSeconds;
        }
    }
}