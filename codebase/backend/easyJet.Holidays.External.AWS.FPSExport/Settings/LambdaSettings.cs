using easyJet.Holidays.External.AWS.Domain.Models;

namespace easyJet.Holidays.External.AWS.FPSExport.Settings;

public class LambdaSettings : BaseLambdaSettings
{
    public string Currencies { get; set; }
    public string IgnoreDepartureAirports { get; set; }
    public DateTime? IgnoreDepartureDateTo { get; set; }
    public string ServiceUrl { get; set; } = string.Empty;
    public string QueueUrl { get; set; } = string.Empty;
    public string DynamoDbTableName { get; set; } = string.Empty;
    public string S3BucketName { get; set; } = string.Empty;
    /// <summary>
    /// If false, lambda will use legacy behavior.
    /// If true, lambda will act according to requirements of new fare class phase 1.
    /// </summary>
    public bool NewFareClassPhaseOneEnabled { get; set; }
    /// <summary>
    /// Availability of seats with FareType HOLIDAYS_DISCOUNTED needs to be >= this value,
    /// for them to be used over STANDARD
    /// </summary>
    public int MinimumDiscountedAvailabilityThreshold { get; set; }
}