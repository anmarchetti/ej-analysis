using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Cms.Api;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Services
{
    public class ApiServiceFactory
    {
        private readonly IOptions<CmsSettings> _cmsSettingsOptions;
        private readonly IOptions<EnvironmentBehaviourSettings> _envSettingsOptions;
        private readonly IOptions<AtcomSettings> _atcomSettingsOptions;

        public ApiServiceFactory(
            IOptions<CmsSettings> cmsSettingsOptions,
            IOptions<EnvironmentBehaviourSettings> envSettingsOptions,
            IOptions<AtcomSettings> atcomSettingsOptions
        )
        {
            _cmsSettingsOptions = cmsSettingsOptions;
            _envSettingsOptions = envSettingsOptions;
            _atcomSettingsOptions = atcomSettingsOptions;
        }

        public ApiService BuildCmsApiService()
        {
            var httpClient = HttpClientFactory.BuildHttpClientWithTimeoutHandler(_envSettingsOptions.Value);

            var apiClient = new CmsApiClient(httpClient, _envSettingsOptions, _cmsSettingsOptions, null, null);

            return new CmsApiService(apiClient, _cmsSettingsOptions);
        }

        public ApiService BuildAtcomApiService()
        {
            var httpClient = HttpClientFactory.BuildHttpClientWithTimeoutHandler(_envSettingsOptions.Value);

            var apiClient = new XmlApiClient(httpClient, _envSettingsOptions);

            return new ApiServiceWithAtcomTimeout(apiClient, _atcomSettingsOptions);
        }

        private class ApiServiceWithAtcomTimeout : ApiService
        {
            private readonly AtcomSettings _atcomSettings;

            public ApiServiceWithAtcomTimeout(IApiClient apiClient, IOptions<AtcomSettings> atcomSettings) : base(apiClient)
            {
                this._atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
            }

            public override int DefaultTimeoutMilliSeconds()
            {
                return _atcomSettings.TimeoutMilliSeconds;
            }
        }
    }
}
