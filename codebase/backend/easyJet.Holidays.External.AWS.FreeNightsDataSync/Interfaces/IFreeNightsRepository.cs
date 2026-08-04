using easyJet.Holidays.External.AWS.FreeNightsDataSync.Models;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Interfaces
{
    /// <summary>
    /// retrieves free nights data from eskel
    /// </summary>
    public interface IFreeNightsRepository
    {
        /// <summary>
        /// Requests all data from eskel
        /// </summary>
        Task<FreeNight[]> GetAll();
    }
}