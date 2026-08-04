using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain.Data.Booking.Extras;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings;

/// <summary>
/// Flight Extras cache
/// </summary>
public class FlightExtraCache
{
    /// <summary>
    /// Flight identifier
    /// </summary>
    [DynamoDBHashKey]
    public string FlightId { get; set; }

    /// <summary>
    /// Flight Extra
    /// </summary>
    [DynamoDBProperty]
    public FlightExtraCategoryList Extra { get; set; }

    /// <summary>
    /// Time-to-Live property
    /// </summary>
    [DynamoDBProperty(StoreAsEpochLong = true)]
    public DateTime TTL { get; set; }
}