using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.External.AWS.Utils;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Polly.Registry;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Utils
{
    public class DynamoDbBatchWritePipelineTests
    {
        private static ResiliencePipelineProvider<string> BuildRealPipelineProvider()
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddDynamoDbBatchWritePipeline();
            return services.BuildServiceProvider().GetRequiredService<ResiliencePipelineProvider<string>>();
        }

        [Fact]
        public async Task BatchWriteWithRetryAsync_RetriesUnprocessedItems()
        {
            // Arrange
            const string tableName = "test-table";

            var awsClient = new Mock<IAmazonDynamoDB>();
            awsClient.SetupSequence(m => m.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new BatchWriteItemResponse
                {
                    UnprocessedItems = new Dictionary<string, List<WriteRequest>>
                    {
                        {
                            tableName,
                            new List<WriteRequest> { new(new PutRequest(new Dictionary<string, AttributeValue>())) }
                        }
                    }
                })
                .ReturnsAsync(new BatchWriteItemResponse());

            var pipeline = BuildRealPipelineProvider()
                .GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey);

            var request = new BatchWriteItemRequest(new Dictionary<string, List<WriteRequest>>
            {
                { tableName, new List<WriteRequest> { new(new PutRequest(new Dictionary<string, AttributeValue>())) } }
            });

            // Act
            await pipeline.WriteAsync(awsClient.Object, request);

            // Assert
            awsClient.Verify(
                m => m.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()),
                Times.Exactly(2));
        }

        [Fact]
        public async Task BatchWriteWithRetryAsync_ThrowsWhenItemsRemainUnprocessedAfterRetries()
        {
            // Arrange
            const string tableName = "test-table";

            var awsClient = new Mock<IAmazonDynamoDB>();
            awsClient.Setup(m => m.BatchWriteItemAsync(It.IsAny<BatchWriteItemRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new BatchWriteItemResponse
                {
                    UnprocessedItems = new Dictionary<string, List<WriteRequest>>
                    {
                        {
                            tableName,
                            new List<WriteRequest> { new(new PutRequest(new Dictionary<string, AttributeValue>())) }
                        }
                    }
                });

            var pipeline = BuildRealPipelineProvider()
                .GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey);

            var request = new BatchWriteItemRequest(new Dictionary<string, List<WriteRequest>>
            {
                { tableName, new List<WriteRequest> { new(new PutRequest(new Dictionary<string, AttributeValue>())) } }
            });

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                pipeline.WriteAsync(awsClient.Object, request));
        }
    }
}
