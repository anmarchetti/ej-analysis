using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.TripAdvisor;

/// <summary>
/// Trip Advisor Cache
/// </summary>
public class TripAdvisorCache
{
    /// <summary>
    /// Key identifier
    /// </summary>
    [DynamoDBHashKey]
    public string Key { get; set; }

    /// <summary>
    /// Hotel Reviews
    /// </summary>
    [DynamoDBProperty]
    public string Data { get; set; }

    /// <summary>
    /// Time-to-Live property
    /// </summary>
    [DynamoDBProperty(StoreAsEpochLong = true)]
    public DateTime TTL { get; set; }
}