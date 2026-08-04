namespace easyJet.Holidays.External.AWS.RequestedPriceSync.Exceptions;

/// <summary>
/// Class describing exceptions related to the RequestedPriceSync
/// </summary>
public class RequestedPriceSyncException : Exception
{
#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member
    public RequestedPriceSyncException(string message) : base(message) { }
    public RequestedPriceSyncException(string message, Exception innerException) : base(message, innerException) { }
    public RequestedPriceSyncException() { }
#pragma warning restore CS1591

    /// <summary>
    /// RequestedPriceSync did not complete successfully
    /// </summary>
    public static RequestedPriceSyncException UnsuccessfulRun => new("RequestedPriceSync did not complete successfully.");
}
