namespace easyJet.Holidays.External.AWS.Services.Counter
{
    /// <summary>
    /// Atomic counter
    /// </summary>
    public interface IAtomicCounterService
    {
        /// <summary>
        /// Get next id using atomic counter
        /// </summary>
        /// <param name="counterName">Counter unique name</param>
        /// <returns></returns>
        Task<decimal> GetNextId(string counterName);
    }
}
