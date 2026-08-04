using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Salesforce.Api
{
    public class SalesforceApiService : ApiService
    {
        public SalesforceApiService(SalesforceApiClient salesforceApiClient) : base(salesforceApiClient)
        {
        }

        public override string Name() => "Salesforce API service.";
    }
}
