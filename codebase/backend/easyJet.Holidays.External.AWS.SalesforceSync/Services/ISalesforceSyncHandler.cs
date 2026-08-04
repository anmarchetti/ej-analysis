using Amazon.Lambda.SQSEvents;

namespace easyJet.Holidays.External.AWS.SalesforceSync.Services;

/// <summary>
/// 
/// </summary>
public interface ISalesforceSyncHandler
{
    /// <summary>
    /// Processes each SQS record and attempts to send a booking to Salesforce.
    /// </summary>
    /// <param name="records">Collection of SQS messages.</param>
    /// <returns>Batch response including any failed item identifiers.</returns>
    Task<SQSBatchResponse> ProcessBatchAsync(IEnumerable<SQSEvent.SQSMessage>? records);
}