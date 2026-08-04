using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.Feefo.Api
{
    public class FeefoApiService : ApiService
    {
        public FeefoApiService(FeefoApiClient feefoApiClient) : base(feefoApiClient)
        {
        }

        public override string Name() => "Feefo API service.";
    }
}
