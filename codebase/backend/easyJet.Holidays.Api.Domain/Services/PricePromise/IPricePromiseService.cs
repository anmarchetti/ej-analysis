using easyJet.Holidays.Api.Domain.Data.PrisePromise;

namespace easyJet.Holidays.Api.Domain.Services.PricePromise
{
    public interface IPricePromiseService
    {
        /// <summary>
        /// Create price promise request and send notification
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        Task<string> Create(PricePromiseModel model);
    }
}
