using easyJet.Holidays.Api.Domain.Data.RequestedPrice;

namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Settings;

/// <summary>
/// configuration for the lambdas operation
/// </summary>
public class LambdaSettings
{
    /// <summary>
    /// table config for repo
    /// </summary>
    public RequestedPriceTableSetting Table { get; set; }

    /// <summary>
    /// limits the upper bound for parallel operations
    /// </summary>
    public int ParallelizationLimit { get; set; }


    /// <summary>
    /// Whether to include hotel level during aggregation
    /// </summary>
    public bool IncludeHotelLevel { get; set; }
}