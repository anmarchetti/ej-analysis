using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
/// <summary>
/// IAtcomRequestParamBuilder
/// </summary>
public interface IAtcomRequestParamBuilder
{
    /// <summary>
    /// Builds the geography param value.
    /// </summary>
    /// <param name="searchSelectionMessage">The search selection message.</param>
    /// <returns>A string.</returns>
    string BuildGeographyParamValue(SearchSelectionData searchSelectionMessage);

    /// <summary>
    /// Builds the date range param chunks.
    /// </summary>
    /// <param name="currentDate">The current date.</param>
    /// <param name="lastAvailableDate">The last available date.</param>
    /// <returns>A list of DateTimeFrames.</returns>
    IList<DateTimeRange> BuildDateRangeParamChunks(DateTime currentDate, DateTime lastAvailableDate);

    /// <summary>
    /// Lasts the day of month after months.
    /// </summary>
    /// <param name="baseDate">The base date.</param>
    /// <param name="months">The months.</param>
    /// <returns>A DateTime.</returns>
    DateTime LastDayOfMonthAfterMonths(DateTime baseDate, int months);
}
