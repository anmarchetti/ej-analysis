using easyJet.Holidays.Api.Domain.Data.ErrataInfo;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces
{
    /// <summary>
    /// handles data import
    /// </summary>
    public interface IImportFlightErrataService
    {
        /// <summary>
        /// Fetch Errata data from database
        /// </summary>
        /// <returns></returns>
        Task<List<FlightErrataModel>> GetFlightErrataInfo();
    }
}
