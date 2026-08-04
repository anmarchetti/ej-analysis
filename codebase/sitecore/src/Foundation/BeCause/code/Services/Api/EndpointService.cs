using System;
using easyJet.Foundation.BeCause.Settings;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.BeCause.Services.Api
{
    [Service(typeof(IEndpointService), Lifetime = Lifetime.Transient)]
    public class EndpointService : IEndpointService
    {
        private readonly BeCauseSettings settings;

        public EndpointService(ISettingsService settingsService)
        {
            settings = settingsService.GetSettings();
        }

        public string GetStatusEndpoint => string.IsNullOrEmpty(settings?.Endpoint)
            ? string.Empty
            : $"{settings.Endpoint}{Constants.Endpoints.Status}";

        public string GetCompaniesSearchEndpoint => string.IsNullOrEmpty(settings?.Endpoint)
            ? string.Empty
            : $"{settings.Endpoint}{Constants.Endpoints.CompaniesSearch}";

        public string GetStandardsSearchEndpoint => string.IsNullOrEmpty(settings?.Endpoint)
            ? string.Empty
            : $"{settings.Endpoint}{Constants.Endpoints.StandardsSearch}";

        public string GetCompanyMappingsEndpoint => string.IsNullOrEmpty(settings?.Endpoint)
            ? string.Empty
            : $"{settings.Endpoint}{Constants.Endpoints.CompanyMappings}";

        public TimeSpan GetPollingDelay => Constants.PollingDelay;
    }
}