namespace easyJet.Holidays.External.AWS.LivePriceSync.Services;

/// <summary>
/// fetches and combines Atcom offers to build quick access to the cheapest price by different types of filters
/// </summary>
public interface ILivePriceSyncFlow
{
    /// <summary>
    /// process the flow from searching in atcom to persisting in dynamo
    /// </summary>
    /// <param name="marketCode"></param>
    /// <returns></returns>
    Task Sync(string marketCode);
}