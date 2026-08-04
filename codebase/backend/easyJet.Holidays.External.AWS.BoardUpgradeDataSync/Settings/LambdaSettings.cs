namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Settings;

/// <summary>
/// settings for this lambda functions operations
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// Discount to filter by during sync operation
    /// </summary>
    public decimal FilterDiscountPercentage { get; set; }

    /// <summary>
    /// Uri for eskel
    /// </summary>
    public Uri EskelUri { get; set; }

    /// <summary>
    /// Seconds to wait for eskel to respond.
    /// </summary>
    public int EskelRequestTimeoutInSeconds { get; set; }
}