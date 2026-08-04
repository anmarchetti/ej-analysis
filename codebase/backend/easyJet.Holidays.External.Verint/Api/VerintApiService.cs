using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Verint.Api
{
    public class VerintApiService : ApiService
    {
        public VerintApiService(VerintApiClient verintApiClient) : base(verintApiClient)
        {
        }

        public override string Name() => "Verint API service.";
    }
}