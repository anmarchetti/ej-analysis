using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Feefo.Api
{
    public class FeefoAuthApiService : ApiService
    {
        public FeefoAuthApiService(FeefoAuthApiClient apiClient) : base(apiClient)
        {
        }

        public override string Name() => "Feefo Auth API service.";
    }
}
