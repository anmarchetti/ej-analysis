namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;

/// <summary>
/// Synchronizes free nights retrieved from Eskel
/// </summary>
public interface IFreeNightsSyncService
{
    /// <summary>
    /// sync free nights data from Eskel system with dynamoDb table
    /// </summary>
    /// <returns></returns>
    Task Sync();
}