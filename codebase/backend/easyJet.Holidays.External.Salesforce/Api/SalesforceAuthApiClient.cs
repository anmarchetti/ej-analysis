using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api.Client;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Salesforce.Api
{
    public class SalesforceAuthApiClient : JsonApiClient
    {
        public SalesforceAuthApiClient(HttpClient client, IOptions<EnvironmentBehaviourSettings> envSettings) : base(client, envSettings)
        {
        }

        public override string MediaType => "application/x-www-form-urlencoded";
    }

}
