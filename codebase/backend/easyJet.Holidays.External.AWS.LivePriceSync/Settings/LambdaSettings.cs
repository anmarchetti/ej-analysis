using easyJet.Holidays.Api.Domain.Data.LivePrice;

namespace easyJet.Holidays.External.AWS.LivePriceSync.Settings;

/// <summary>
/// settings for the lambda's operation
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// settings for the table used for persisting
    /// </summary>
    public LivePriceTableSetting Table { get; set; }

    /// <summary>
    /// TTL of records
    /// </summary>
    public int RecordExpiryDays { get; set; }
}