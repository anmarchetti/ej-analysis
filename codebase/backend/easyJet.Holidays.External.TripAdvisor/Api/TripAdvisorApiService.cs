using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.TripAdvisor.Api
{
    public class TripAdvisorApiService : ApiService
    {
        private readonly TripAdvisorSettings _taSettings;

        public TripAdvisorApiService(TripAdvisorApiClient apiClient, IOptions<TripAdvisorSettings> taSettings) : base(apiClient)
        {
            _taSettings = taSettings.Value ?? throw new ArgumentNullException(nameof(taSettings));
        }

        /// <inheritdoc />
        public override string Name() => "TripAdvisor API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _taSettings.TimeoutMilliSeconds;
        }
    }
}