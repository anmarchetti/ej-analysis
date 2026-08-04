using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.Search;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
/// <summary>
/// ICheapestMonthService
/// </summary>
public interface ICheapestMonthService
{
    /// <summary>
    /// Finds the cheapest month.
    /// </summary>
    /// <param name="searchSelectionMessage">The search selection message.</param>
    /// <param name="dateRangeChunk">The date range chunk.</param>
    /// <returns>A Task.</returns>
    Task<CheapestMonthDetails?> FindCheapestMonth(SearchSelectionData searchSelectionMessage, DateTimeRange dateRangeChunk);
}
