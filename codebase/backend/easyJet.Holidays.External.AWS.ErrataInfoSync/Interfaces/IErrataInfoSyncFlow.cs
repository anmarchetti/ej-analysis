namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;

/// <summary>
/// Handles ErrataInfo synchronization 
/// </summary>
public interface IErrataInfoSyncFlow
{
    /// <summary>
    /// 
    /// </summary>
    /// <returns></returns>
    Task Sync();
}