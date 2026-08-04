using easyJet.Holidays.External.AWS.CheapestMonthSync.Services;
using easyJet.Holidays.External.AWS.Models.CheapestMonth;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.AWS.CheapestMonthSync.Tests.Services;
public class AtcomRequestParamBuilderTests
{
    [Fact]
    public void BuildGeographyParamValue_WhenVirtualRegion_ReturnsCountryAndRelatedRegions()
    {
        var builder = new AtcomRequestParamBuilder();
        var searchSelectionData = new SearchSelectionData
        {
            RegionDetails = new RegionDetails
            {
                CountryCode = "C1",
                RegionCode = "V1",
                RelatedRegions = [ "R1", "R2" ]
            }
        };

        var result = builder.BuildGeographyParamValue(searchSelectionData);

        result.Should().Be("C1,R1|R2");
    }

    [Fact]
    public void BuildGeographyParamValue_WhenRegularRegion_ReturnsCountryAndRegions()
    {
        var builder = new AtcomRequestParamBuilder();
        var searchSelectionData = new SearchSelectionData
        {
            RegionDetails = new RegionDetails
            {
                CountryCode = "C1",
                RegionCode = "R1"
            }
        };

        var result = builder.BuildGeographyParamValue(searchSelectionData);

        result.Should().Be("C1,R1");
    }

    [Fact]
    public void BuildDateRangeParamChunks_WhenLastAvailableDateLowerThan1Year_ReturnsCorrectNumberOfChunks()
    {
        var builder = new AtcomRequestParamBuilder();
        var currentDate = new DateTime(2026, 1, 1);
        var lastAvailableDate = new DateTime(2026, 5, 1);

        var result = builder.BuildDateRangeParamChunks(currentDate, lastAvailableDate);

        result.Should().HaveCount(1);
        result[0].From.Should().Be(currentDate);
        result[0].To.Should().Be(lastAvailableDate);
    }

    [Fact]
    public void BuildDateRangeParamChunks_WhenLastAvailableDateTheSameAsFirstChunkEndDate_ReturnsCorrectNumberOfChunks()
    {
        var builder = new AtcomRequestParamBuilder();
        var currentDate = new DateTime(2026, 2, 1);
        //first chunk end date is currentDate + 11 months = 2027-01-31
        //2nd chunk should not be created in such case
        var lastAvailableDate = new DateTime(2027, 1, 31);

        var result = builder.BuildDateRangeParamChunks(currentDate, lastAvailableDate);

        result.Should().HaveCount(1);
        result[0].From.Should().Be(currentDate);
        result[0].To.Should().Be(lastAvailableDate);
    }

    [Fact]
    public void BuildDateRangeParamChunks_WhenLastAvailableDateBetween1And2Years_ReturnsCorrectNumberOfChunks()
    {
        var builder = new AtcomRequestParamBuilder();
        var currentDate = new DateTime(2026, 1, 1);
        var lastAvailableDate = new DateTime(2027, 2, 1);

        var result = builder.BuildDateRangeParamChunks(currentDate, lastAvailableDate);

        result.Should().HaveCount(2);
        result[0].From.Should().Be(currentDate);
        result[0].To.Should().Be(new DateTime(2026, 12, 31));
        result[1].From.Should().Be(new DateTime(2027, 1, 1));
        result[1].To.Should().Be(lastAvailableDate);
    }

    [Fact]
    public void LastDayOfMonthAfterMonths_WhenCalled_ReturnsDatetimeWithLastDateOfMonth()
    {
        var builder = new AtcomRequestParamBuilder();
        var baseDate = new DateTime(2026, 1, 1);
        var monthsToAdd = 11;

        var result = builder.LastDayOfMonthAfterMonths(baseDate, monthsToAdd);

        result.Should().Be(new DateTime(2026, 12, 31));
    }
}
