using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.External.AWS.CheapestMonthSync.Services.Interfaces;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
/// <summary>
/// AtcomRequestParamBuilder
/// </summary>
public class AtcomRequestParamBuilder : IAtcomRequestParamBuilder
{
    /// <summary>
    /// The chunk month count.
    /// </summary>
    public const int ChunkMonthCount = 11;

    /// <summary>
    /// Builds the geography param value.
    /// </summary>
    /// <param name="searchSelectionMessage">The search selection message.</param>
    /// <returns>A string.</returns>
    public string BuildGeographyParamValue(SearchSelectionData searchSelectionMessage)
    {
        if (searchSelectionMessage == null)
        {
            throw new InvalidOperationException("Message should not be null.");
        }

        if (searchSelectionMessage.RegionDetails.RelatedRegions != null)
        {
            var virtualRegions = string.Join("|", searchSelectionMessage.RegionDetails.RelatedRegions);
            return JoinCountryAndRegions(searchSelectionMessage.RegionDetails.CountryCode, virtualRegions);
        }

        return JoinCountryAndRegions(searchSelectionMessage.RegionDetails.CountryCode, searchSelectionMessage.RegionDetails.RegionCode);
    }

    /// <summary>
    /// Builds the date range param chunks.
    /// </summary>
    /// <param name="currentDate">The current date.</param>
    /// <param name="lastAvailableDate">The last available date.</param>
    /// <returns>A list of DateTimeFrames.</returns>
    public IList<DateTimeRange> BuildDateRangeParamChunks(DateTime currentDate, DateTime lastAvailableDate)
    {
        var dateRangeChunks = new List<DateTimeRange>();

        var firstChunkStartDate = currentDate;
        var firstChunkExactEndDate = LastDayOfMonthAfterMonths(firstChunkStartDate, ChunkMonthCount);
        if (lastAvailableDate <= firstChunkExactEndDate)
        {
            firstChunkExactEndDate = lastAvailableDate;
            dateRangeChunks.Add(new DateTimeRange(firstChunkStartDate, firstChunkExactEndDate));
            return dateRangeChunks;
        }

        var secondChunkStartDate = firstChunkExactEndDate.AddDays(1);
        var secondChunkEndDate = LastDayOfMonthAfterMonths(secondChunkStartDate, ChunkMonthCount);
        if (lastAvailableDate < secondChunkEndDate)
        {
            secondChunkEndDate = lastAvailableDate;
        }

        dateRangeChunks.Add(new DateTimeRange(firstChunkStartDate, firstChunkExactEndDate));
        dateRangeChunks.Add(new DateTimeRange(secondChunkStartDate, secondChunkEndDate));
        return dateRangeChunks;
    }

    /// <summary>
    /// Lasts the day of month after months.
    /// </summary>
    /// <param name="baseDate">The base date.</param>
    /// <param name="months">The months.</param>
    /// <returns>A DateTime.</returns>
    public DateTime LastDayOfMonthAfterMonths(DateTime baseDate, int months)
    {
        var endDayOfMonth = baseDate.AddMonths(months);
        return new DateTime(endDayOfMonth.Year, endDayOfMonth.Month, DateTime.DaysInMonth(endDayOfMonth.Year, endDayOfMonth.Month), 0, 0, 0, DateTimeKind.Utc);
    }

    /// <summary>
    /// Joins the country and regions.
    /// </summary>
    /// <param name="countryCode">The country code.</param>
    /// <param name="regionsCodes">The regions codes.</param>
    /// <returns>A string.</returns>
    private static string JoinCountryAndRegions(string countryCode, string regionsCodes) =>
         $"{countryCode},{regionsCodes}";
     
}
