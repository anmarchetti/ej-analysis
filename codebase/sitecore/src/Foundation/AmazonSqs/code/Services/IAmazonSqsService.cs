using Amazon;
using Amazon.SQS.Model;

namespace easyJet.Foundation.AmazonSqs.Services
{
    public interface IAmazonSqsService
    {
        SendMessageBatchResponse SendMessageBatch(SendMessageBatchRequest request);

        SendMessageResponse SendMessage(SendMessageRequest request);

        ReceiveMessageResponse ReceiveMessage(ReceiveMessageRequest request);

        string GetQueueUrl(Arn arn);

        string GetQueueUrl(string arn);

        string GetQueueUrl(string region, string accountId, string queueName);
    }
}