using System;

namespace easyJet.Foundation.BeCause.Services.Api
{
    public interface IEndpointService
    {
        string GetStatusEndpoint { get; }

        string GetCompaniesSearchEndpoint { get; }

        string GetStandardsSearchEndpoint { get; }

        string GetCompanyMappingsEndpoint { get; }

        TimeSpan GetPollingDelay { get; }
    }
}