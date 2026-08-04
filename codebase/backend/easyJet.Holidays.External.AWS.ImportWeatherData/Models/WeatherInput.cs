using CsvHelper.Configuration.Attributes;

namespace easyJet.Holidays.External.AWS.ImportWeatherData.Models;

public record WeatherInput
{
    [Name("loc_id")]
    public int LocationId { get; init; }

    [Name("month")]
    public int Month { get; init; }

    [Name("avgmaxtempC")]
    public int AverageTemp { get; init; }

    [Name("avgraindays")]
    public int RainyDays { get; init; }
}
