namespace easyJet.Holidays.External.AWS.ImportWeatherData.Models.Configuration;

public record LocationSettings
{
    public string S3Bucket { get; init; }
    public string WeatherFilePath { get; init; }
    public string RegionsFilePath { get; init; }
    public string WeatherTable { get; init; }
}