using easyJet.Holidays.Api.Domain.Data.PrisePromise;

namespace easyJet.Holidays.Api.Domain.Interfaces.PricePromise
{
    /// <summary>
    /// Price promise services
    /// </summary>
    public interface IPricePromiseRepository
    {
        /// <summary>
        /// Create price promise request item
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        Task<IEnumerable<PriceAttachment>> Create(PricePromiseModel model);
    }
}
