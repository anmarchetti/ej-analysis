using Amazon.Lambda.SQSEvents;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Services;

/// <summary>
/// Handles forwarding to feefo
/// </summary>
public interface IFeefoProcessor
{
    /// <summary>
    /// Processes the records by first confirming consent and then sending a sample of records to feefo
    /// </summary>
    /// <param name="records"></param>
    /// <returns></returns>
    public Task<SQSBatchResponse> Process(ICollection<SQSEvent.SQSMessage> records);
}