namespace easyJet.Holidays.Api.Domain.Interfaces.MissedSearches
{
    public interface IMissedSearchesService
    {
        /// <summary>
        /// Saves query of missed search
        /// </summary>
        /// <param name="query"></param>
        /// <param name="from"></param>
        /// <param name="flexibleDays"></param>
        /// <param name="startDate"></param>
        /// <param name="endDate"></param>
        /// <returns></returns>
        Task Save(string query, string from, int flexibleDays, DateTime? startDate, DateTime? endDate);
    }
}
