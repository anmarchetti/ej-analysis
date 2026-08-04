using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using easyJet.Holidays.External.Atcom.Services.TouristTax;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.External.Atcom.Tests.Services.TouristTax;

public class TouristTaxRuleMapTests
{
    private static TouristTaxRule ReadSingle(string csv)
    {
        using var reader = new StringReader(csv);
        var config = new CsvConfiguration(CultureInfo.GetCultureInfo("en-GB"))
        {
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            MissingFieldFound = null,
            HeaderValidated = null,
            PrepareHeaderForMatch = args => args.Header?.Trim()
        };
        using var csvReader = new CsvReader(reader, config);
        csvReader.Context.TypeConverterOptionsCache.AddOptions<DateOnly>(new CsvHelper.TypeConversion.TypeConverterOptions
        {
            Formats = new[] { "dd/MM/yyyy", "dd/MM/yy", "yyyy-MM-dd" },
            CultureInfo = CultureInfo.GetCultureInfo("en-GB")
        });
        csvReader.Context.RegisterClassMap<TouristTaxRuleMap>();
        return csvReader.GetRecords<TouristTaxRule>().First();
    }

    [Theory]
    [InlineData("01/01/2026", "31/12/2026")]
    [InlineData("01/01/26", "31/12/26")]
    [InlineData("2026-01-01", "2026-12-31")]
    public void Maps_Dates_With_Supported_Formats(string from, string to)
    {
        var csv = $"Application Type,Currency,Country Name,Country Code,Region Name,Region Code,Resort Name,Resort Code,Geography,Travel From Date,Travel To Date,Percentage Rate 3 Star,Percentage Rate 4 Star,Percentage Rate 5 Star,Room Rate 3 Star,Room Rate 4 Star,Room Rate 5 Star,Pax Rate Adult 3 Star,Pax Rate Adult 4 Star,Pax Rate Adult 5 Star,Pax Rate Child 3 Star,Pax Rate Child 4 Star,Pax Rate Child 5 Star,Per Night / Per Stay,Maximum Nights Cap,Minimum Value Cap,Maximum Value Cap\n" +
                  $"PercentageBased,EUR,Italy,IT,ITFU,ITFU,ResNm,RES,ITFU,{from},{to},0,0.2,0,0,0,0,0,0,0,0,0,,PS,0,0,,300\n";

        var rule = ReadSingle(csv);
        rule.TravelFromDate.Should().Be(DateOnly.ParseExact(from.Length == 10 && from[4] == '-' ? from : from, new[] { "dd/MM/yyyy", "dd/MM/yy", "yyyy-MM-dd" }, CultureInfo.GetCultureInfo("en-GB"), DateTimeStyles.None));
        rule.TravelToDate.Should().Be(DateOnly.ParseExact(to.Length == 10 && to[4] == '-' ? to : to, new[] { "dd/MM/yyyy", "dd/MM/yy", "yyyy-MM-dd" }, CultureInfo.GetCultureInfo("en-GB"), DateTimeStyles.None));
    }

    [Fact]
    public void Maps_Numeric_Blanks_To_Defaults()
    {
        var csv = "Application Type,Currency,Country Name,Country Code,Region Name,Region Code,Resort Name,Resort Code,Geography,Travel From Date,Travel To Date,Percentage Rate 3 Star,Percentage Rate 4 Star,Percentage Rate 5 Star,Room Rate 3 Star,Room Rate 4 Star,Room Rate 5 Star,Pax Rate Adult 3 Star,Pax Rate Adult 4 Star,Pax Rate Adult 5 Star,Pax Rate Child 3 Star,Pax Rate Child 4 Star,Pax Rate Child 5 Star,Per Night / Per Stay,Maximum Nights Cap,Minimum Value Cap,Maximum Value Cap\n" +
                  "RoomBased,GBP,United Kingdom,GB,Reg,REG,Res,RES,GB,01/01/26,31/12/26,,,,100,,,,,,,,,,0,0,999\n";

        var rule = ReadSingle(csv);
        rule.RoomRate3Star.Should().Be(100);
        rule.PercentageRate4Star.Should().BeNull();
        rule.MaximumValueCap.Should().Be(999);
    }

    [Fact]
    public void Maps_PerNightOrPerStay_String()
    {
        var csv = "Application Type,Currency,Country Name,Country Code,Region Name,Region Code,Resort Name,Resort Code,Geography,Travel From Date,Travel To Date,Percentage Rate 3 Star,Percentage Rate 4 Star,Percentage Rate 5 Star,Room Rate 3 Star,Room Rate 4 Star,Room Rate 5 Star,Pax Rate Adult 3 Star,Pax Rate Adult 4 Star,Pax Rate Adult 5 Star,Pax Rate Child 3 Star,Pax Rate Child 4 Star,Pax Rate Child 5 Star,Per Night / Per Stay,Maximum Nights Cap,Minimum Value Cap,Maximum Value Cap\n" +
                  "PaxFlatBased,EUR,Spain,ES,ESFU,ESFU,ESFU13,ESFU13,ESFU13,01/01/26,31/12/26,0,0,0,0,0,0,0,10,0,0,5,,PN,10,0,999\n";

        var rule = ReadSingle(csv);
        rule.PerNightOrPerStay.Should().Be("PN");
        rule.PaxRateAdult4Star.Should().Be(10);
        rule.PaxRateChild4Star.Should().Be(5);
    }
}
