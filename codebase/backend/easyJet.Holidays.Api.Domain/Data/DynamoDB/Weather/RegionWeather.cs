using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain.Extensions;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Weather;

public record RegionWeather
{
    [DynamoDBHashKey("Region")]
    public string Region { get; init; }

    [DynamoDBProperty]
    public int[] AverageTemp { get; init; }

    [DynamoDBProperty]
    public int[] RainyDays { get; init; }

    public override string ToString()
    {
        return $"Region: {Region}, AverageTemp: {AverageTemp.AllToString()}, RainyDays: {RainyDays.AllToString()}";
    }
}
