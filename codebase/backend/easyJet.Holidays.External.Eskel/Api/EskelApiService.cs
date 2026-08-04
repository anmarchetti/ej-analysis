using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Eskel.Settings;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Eskel.Api
{
    public class EskelApiService : ApiService
    {
        private readonly EskelSettings _eskelSettingsSettings;
        public EskelApiService(EskelApiClient eskelApiClient, IOptions<EskelSettings> eskelSettingsSettings) : base(eskelApiClient)
        {
            _eskelSettingsSettings = eskelSettingsSettings.Value;
        }

        public override string Name() => "Eskel API service.";

        /// <inheritdoc />
        public override int DefaultTimeoutMilliSeconds()
        {
            return _eskelSettingsSettings.TimeoutMilliSeconds;
        }
    }
}
