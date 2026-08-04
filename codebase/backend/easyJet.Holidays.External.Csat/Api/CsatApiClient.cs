using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;
using System.Diagnostics.CodeAnalysis;

namespace easyJet.Holidays.External.Csat.Api
{
    /// <summary>
    /// Csat Api Client
    /// </summary>
    public class CsatApiClient : BaseApiClient
    {
        /// <inheritdoc />
        public CsatApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }

        /// <summary>
        /// Media Type
        /// </summary>
        [ExcludeFromCodeCoverage]
        public override string MediaType => "application/x-www-form-urlencoded";

    }
}