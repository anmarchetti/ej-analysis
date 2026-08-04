using easyJet.Holidays.External.Domain.Api;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Ccp.Api
{
    /// <summary>
    /// Provides services for interacting with the CCP API, utilizing the underlying functionality of the ApiService base class.
    /// </summary>
    public class CcpApiService : ApiService
    {
        /// <inheritdoc />
        public CcpApiService(CcpApiClient apiClient) : base(apiClient)
        {
        }

        /// <inheritdoc />
        public override string Name() => "CCP API service.";

    }
}