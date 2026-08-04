using easyJet.Holidays.External.Domain.Api;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Csat.Api
{
    /// <summary>
    /// Csat Api Service
    /// </summary>
    public class CsatApiService : ApiService
    {
        /// <inheritdoc />
        public CsatApiService(CsatApiClient apiClient) : base(apiClient)
        {
        }

        /// <inheritdoc />
        [ExcludeFromCodeCoverage]
        public override string Name() => "Csat API service.";

    }
}