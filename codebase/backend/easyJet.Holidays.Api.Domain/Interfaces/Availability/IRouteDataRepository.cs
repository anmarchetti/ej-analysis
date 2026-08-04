using easyJet.Holidays.Api.Domain.Data.Availability;

namespace easyJet.Holidays.Api.Domain.Interfaces.Availability
{
    /// <summary>
    /// Interface describing service to get routes availability and schedule
    /// </summary>
    public interface IRouteDataRepository
    {
        /// <summary>
        /// Routes availability for all dates
        /// </summary>
        /// <param name="version"></param>
        /// <returns></returns>
        Task<Dictionary<string, List<AvailabilityRecord>>> GetAllArrangement(int version, string market);

        /// <summary>
        /// Availability based on departure airport
        /// </summary>
        /// <param name="toAirport"></param>
        /// <param name="version"></param>
        /// <returns></returns>
        Task<Dictionary<string, List<string>>> GetFromAvailability(string toAirport, int version, string market);

        /// <summary>
        /// Availability based on destination airport
        /// </summary>
        /// <param name="fromAirport"></param>
        /// <param name="market"></param>
        /// <param name="version"></param>
        /// <returns></returns>
        Task<Dictionary<string, List<string>>> GetToAvailability(string fromAirport, string market, int version);

        /// <summary>
        /// Availability based on destination market
        /// </summary>
        /// <param name="market"></param>
        /// <param name="version"></param>
        /// <returns></returns>
        Task<Dictionary<string, List<string>>> GetToAvailability(string market, int version);

        /// <summary>
        /// Availability data version
        /// </summary>
        /// <returns></returns>
        Task<int> GetLatestVersion();
    }
}
