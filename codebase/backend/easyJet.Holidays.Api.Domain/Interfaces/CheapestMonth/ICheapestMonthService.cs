using easyJet.Holidays.Api.Domain.Data.Search;

namespace easyJet.Holidays.Api.Domain.Interfaces.CheapestMonth;
/// <summary>
/// ICheapestMonthService
/// </summary>
public interface ICheapestMonthService
{
    /// <summary>
    /// Gets the cheapest months.
    /// </summary>
    /// <param name="cheapestMonthRequest">The cheapest month request.</param>
    /// <returns>A Task.</returns>
    Task<List<CheapestMonthDetails>> GetCheapestMonths(CheapestMonthRequest cheapestMonthRequest);
}
