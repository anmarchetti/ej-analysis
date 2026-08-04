using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Salesforce.Api
{
    public class SalesforceAuthApiService : ApiService
    {
        public SalesforceAuthApiService(SalesforceAuthApiClient apiClient) : base(apiClient)
        {
        }

        public override string Name() => "Salesforce Auth API service.";
    }
}
