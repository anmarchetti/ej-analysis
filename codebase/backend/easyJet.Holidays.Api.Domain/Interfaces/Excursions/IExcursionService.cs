using easyJet.Holidays.Api.Domain.Data.Excursions;

namespace easyJet.Holidays.Api.Domain.Interfaces.Excursions
{
    /// <summary>
    /// Interface describes service to get excursions
    /// </summary>
    public interface IExcursionService
    {
        /// <summary>
        /// Search available excursions by specified query string params
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        Task<ExcursionsResponse> Search(ExcursionsRequest request);
    }
}
