namespace easyJet.Holidays.External.AWS.BoardUpgradeDataSync.Services;

/// <summary>
/// Sync board upgrade data from Eskel system with dynamoDb table
/// </summary>
public interface IBoardUpgradeSyncingService
{
    /// <summary>
    /// Executes the sync
    /// </summary>
    /// <returns></returns>
    Task Sync();
}