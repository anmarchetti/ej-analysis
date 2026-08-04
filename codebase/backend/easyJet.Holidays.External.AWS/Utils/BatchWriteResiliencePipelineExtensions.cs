using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Polly;

namespace easyJet.Holidays.External.AWS.Utils;

internal static class BatchWriteResiliencePipelineExtensions
{
    internal static async Task WriteAsync(
        this ResiliencePipeline<BatchWriteItemResponse> pipeline,
        IAmazonDynamoDB client,
        BatchWriteItemRequest request)
    {
        var pendingRequest = request;

        var response = await pipeline.ExecuteAsync(async ct =>
        {
            var result = await client.BatchWriteItemAsync(pendingRequest, ct);

            if (result.UnprocessedItems?.Values.Sum(l => l.Count) > 0)
                pendingRequest = new BatchWriteItemRequest { RequestItems = result.UnprocessedItems };

            return result;
        });

        if (response.UnprocessedItems?.Values.Sum(l => l.Count) > 0)
        {
            throw new InvalidOperationException(
                $"BatchWriteItem failed after retries. {response.UnprocessedItems.Values.Sum(l => l.Count)} item(s) remain unprocessed.");
        }
    }
}
