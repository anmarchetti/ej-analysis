using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Dflo.Api
{
    public class DfloApiService : ApiService
    {
        private readonly DfloSettings _dfloSettings;

        public DfloApiService(DfloApiClient apiClient, IOptions<DfloSettings> dfloSettings) : base(apiClient)
        {
            _dfloSettings = dfloSettings.Value ?? throw new ArgumentNullException(nameof(dfloSettings));
        }

        /// <inheritdoc />
        public override string Name() => "dFlo API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _dfloSettings.TimeoutMilliSeconds;
        }
    }
}