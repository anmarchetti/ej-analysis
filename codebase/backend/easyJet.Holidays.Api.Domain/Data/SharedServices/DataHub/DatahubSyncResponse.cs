#nullable enable
namespace easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;

/// <summary>
/// Datahub Synchronize Pnr Response
/// </summary>
public class DatahubSyncResponse
{
    /// <summary>
    /// Results of the queuing operation
    /// </summary>
    public Dictionary<string, SyncAttempt> Results { get; init; } = new();
}

/// <summary>
/// Information about an attempt made to queue some reservation for re-sync via atcom
/// </summary>
public class SyncAttempt
{
    /// <summary>
    /// Status of the attempt
    /// </summary>
    public required SyncStatus Status { get; set; }

    /// <summary>
    /// code of error, if any
    /// </summary>
    public required string? ErrorCode { get; set; }

    /// <summary>
    /// message associated with error, if any
    /// </summary>
    public required string? ErrorMessage { get; set; }
}

/// <summary>
/// Status of queuing attempts to atcoms sync queues
/// </summary>
public enum SyncStatus
{
    /// <summary>
    /// indicating an unsuccessful queueing attempt
    /// </summary>
    Error,
    /// <summary>
    /// indicating a successful queueing attempt
    /// </summary>
    Queued
}