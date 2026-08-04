using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.WebApi.Models;

namespace easyJet.Foundation.WebApi.Services.CancellationAndRefund
{
    [Service(typeof(ICancellationAndRefundService), Lifetime = Lifetime.Singleton)]
    public class CancellationAndRefundService : ICancellationAndRefundService
    {
        private readonly IMasterDataService dataService;

        public CancellationAndRefundService(IMasterDataService dataService)
        {
            this.dataService = dataService;
        }

        public CancellationAndRefundResponse GetCancellationAndRefundresult<T>(T data)
        {
            CancellationAndRefundRequest request = new CancellationAndRefundRequest() { Data = new { Booking = data } };
            return dataService.Post<CancellationAndRefundRequest, CancellationAndRefundResponse>(request);
        }
    }
}