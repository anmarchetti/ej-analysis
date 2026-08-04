using CsvHelper.Configuration.Attributes;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Models;

public record RegionInput
{
    [Name("id")]
    public int LocationId { get; init; }

    [Name("region")]
    public string Region { get; init; }
}
