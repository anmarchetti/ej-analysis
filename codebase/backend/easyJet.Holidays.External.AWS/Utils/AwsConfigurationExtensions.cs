using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace easyJet.Holidays.External.AWS.Utils;

/// <summary>
/// Holds extensions for registering Aws services
/// </summary>
public static class AwsConfigurationExtensions
{
    /// <summary>
    /// Registers a singleton <see cref="DynamoDBContext"/>, utilizing the v4 favoured approach
    /// via <see cref="DynamoDBContextBuilder"/>. <br />
    /// Depends on a concrete <see cref="AwsClient"/> being constructable.
    /// </summary>
    /// <param name="instance"></param>
    public static void RegisterDynamoDbContext(this IServiceCollection instance)
    {
        instance.AddSingleton<IDynamoDBContext, DynamoDBContext>(sp =>
            new DynamoDBContextBuilder()
                .WithDynamoDBClient(
                    () => new AwsClient(sp.GetRequiredService<IOptions<AwsSettings>>())
                        .GetClient()
                ).Build()
        );
    }

    /// <summary>
    /// Registers a named <see cref="Polly.ResiliencePipeline{T}"/> for DynamoDB <c>BatchWriteItem</c> calls,
    /// with exponential back-off retry on unprocessed items.
    /// </summary>
    /// <param name="instance"></param>
    public static void AddDynamoDbBatchWritePipeline(this IServiceCollection instance)
    {
        const int maxRetryAttempts = 10;

        instance.AddResiliencePipeline<string, BatchWriteItemResponse>(
            DynamoDbBatchWritePipelineKey,
            (builder, context) =>
            {
                var logger = context.ServiceProvider.GetRequiredService<ILogger<BatchWriteItemResponse>>();
                builder.AddRetry(new RetryStrategyOptions<BatchWriteItemResponse>
                {
                    MaxRetryAttempts = maxRetryAttempts,
                    Delay = TimeSpan.FromMilliseconds(100),
                    MaxDelay = TimeSpan.FromMilliseconds(5000),
                    BackoffType = DelayBackoffType.Exponential,
                    UseJitter = true,
                    ShouldHandle = args => ValueTask.FromResult(
                        args.Outcome.Result != null &&
                        args.Outcome.Result.UnprocessedItems?.Values.Sum(l => l.Count) > 0),
                    OnRetry = args =>
                    {
                        var remaining = args.Outcome.Result!.UnprocessedItems?.Values.Sum(l => l.Count) ?? 0;
                        logger.LogWarning(
                            "BatchWriteItem throttled. Retrying {Remaining} unprocessed item(s). Retry {Attempt}/{MaxRetryAttempts}, delay {DelayMs}ms",
                            remaining,
                            args.AttemptNumber + 1,
                            maxRetryAttempts,
                            (int)args.RetryDelay.TotalMilliseconds);
                        return ValueTask.CompletedTask;
                    }
                });
            });
    }

    /// <summary>The key used to resolve the DynamoDB batch-write resilience pipeline from <see cref="Polly.Registry.ResiliencePipelineProvider{TKey}"/>.</summary>
    public const string DynamoDbBatchWritePipelineKey = "dynamodb-batch-write";
}