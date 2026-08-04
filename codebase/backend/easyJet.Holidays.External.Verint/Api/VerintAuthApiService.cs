using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Verint.Api
{
    public class VerintAuthApiService : ApiService
    {
        public VerintAuthApiService(VerintAuthApiClient apiClient) : base(apiClient)
        {
        }

        public override string Name() => "Verint Auth API service.";
    }
}