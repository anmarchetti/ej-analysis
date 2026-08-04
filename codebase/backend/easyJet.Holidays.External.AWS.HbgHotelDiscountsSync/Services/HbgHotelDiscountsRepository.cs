using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Models;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.HbgHotelDiscountsSync.Services;

internal interface IHbgHotelDiscountsRepository
{
    /// <summary>
    /// Clears all discounted offers from the specified DynamoDB table.
    /// </summary>
    /// <param name="tableName"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task ClearOffers(string tableName, CancellationToken cancellationToken);

    /// <summary>
    /// Writes HBG hotel discounts to the specified DynamoDB table.
    /// </summary>
    /// <param name="offers"></param>
    /// <param name="tableName"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task<int> WriteOffers(IReadOnlyCollection<HbgHotelDiscount> offers, string tableName, CancellationToken cancellationToken);
}

internal sealed class HbgHotelDiscountsRepository : IHbgHotelDiscountsRepository
{
    private readonly IAmazonDynamoDB _dynamoDb;
    private readonly ILogger<HbgHotelDiscountsRepository> _logger;

    /// <summary>
    /// constructor for <see cref="HbgHotelDiscountsRepository"/>.
    /// </summary>
    /// <param name="dynamoDb"></param>
    /// <param name="logger"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public HbgHotelDiscountsRepository(IAmazonDynamoDB dynamoDb, ILogger<HbgHotelDiscountsRepository> logger)
    {
        _dynamoDb = dynamoDb ?? throw new ArgumentNullException(nameof(dynamoDb));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<int> WriteOffers(IReadOnlyCollection<HbgHotelDiscount> offers, string tableName, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(offers);

        if (offers.Count == 0)
        {
            return 0;
        }

        var culture = CultureInfo.InvariantCulture;
        var totalWritten = 0;

        foreach (var batch in offers.Chunk(25))
        {
            var writeRequests = batch.Select(item => new WriteRequest(new PutRequest(new Dictionary<string, AttributeValue>
            {
                [nameof(HbgHotelDiscount.AccommodationCode)] = new AttributeValue { S = item.AccommodationCode.ToString(culture) },
                [nameof(HbgHotelDiscount.Discounts)] = new AttributeValue
                {
                    L = [.. item.Discounts.Select(discount => new AttributeValue
                    {
                        M = new Dictionary<string, AttributeValue>
                        {
                            [nameof(Discount.GiataCode)] = new AttributeValue { N = discount.GiataCode.ToString(culture) },
                            [nameof(Discount.DiscountPercentage)] = new AttributeValue { N = discount.DiscountPercentage.ToString(culture) },
                            [nameof(Discount.AccommodationName)] = new AttributeValue { S = discount.AccommodationName },
                            [nameof(Discount.TravelWindowFrom)] = new AttributeValue { S = discount.TravelWindowFrom },
                            [nameof(Discount.TravelWindowTo)] = new AttributeValue { S = discount.TravelWindowTo }
                        }
                    })]
                }
            }))).ToList();

            var request = new BatchWriteItemRequest(new Dictionary<string, List<WriteRequest>> { { tableName, writeRequests } });

            var response = await _dynamoDb.BatchWriteItemAsync(request, cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Null response returned from BatchWriteItemAsync for {Table}", tableName);
                continue;
            }

            var unprocessedCount = 0;
            if (response.UnprocessedItems != null && response.UnprocessedItems.Count > 0)
            {
                unprocessedCount = response.UnprocessedItems.Sum(kv => kv.Value?.Count ?? 0);
                if (unprocessedCount > 0)
                {
                    _logger.LogWarning("There are {Count} unprocessed discounted offers", unprocessedCount);
                }
            }

            totalWritten += writeRequests.Count - unprocessedCount;
        }

        return totalWritten;
    }

    /// <inheritdoc/>
    public async Task ClearOffers(string tableName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(tableName))
        {
            throw new ArgumentException("Table name is required.", nameof(tableName));
        }

        Dictionary<string, AttributeValue>? lastEvaluatedKey = null;

        do
        {
            var response = await _dynamoDb.ScanAsync(CreateScanRequest(tableName, lastEvaluatedKey), cancellationToken);
            if (response == null)
            {
                return;
            }

            lastEvaluatedKey = response.LastEvaluatedKey;

            var deleteRequests = BuildDeleteRequests(response.Items);
            if (deleteRequests.Count == 0)
            {
                continue;
            }

            await ExecuteBatchDeletes(tableName, deleteRequests, cancellationToken);
        }
        while (lastEvaluatedKey != null && lastEvaluatedKey.Count > 0);
    }

    private static ScanRequest CreateScanRequest(string tableName, Dictionary<string, AttributeValue>? lastEvaluatedKey) =>
        new()
        {
            TableName = tableName,
            ProjectionExpression = nameof(HbgHotelDiscount.AccommodationCode),
            ExclusiveStartKey = lastEvaluatedKey
        };

    private static List<WriteRequest> BuildDeleteRequests(List<Dictionary<string, AttributeValue>>? items) =>
        items?.Where(item => item.TryGetValue(nameof(HbgHotelDiscount.AccommodationCode), out _))
            .Select(item => new WriteRequest(new DeleteRequest(new Dictionary<string, AttributeValue>
            {
                [nameof(HbgHotelDiscount.AccommodationCode)] = item[nameof(HbgHotelDiscount.AccommodationCode)]
            })))
            .ToList() ?? [];

    private async Task ExecuteBatchDeletes(string tableName, List<WriteRequest> deleteRequests, CancellationToken cancellationToken)
    {
        foreach (var batch in deleteRequests.Chunk(25))
        {
            var request = new BatchWriteItemRequest(new Dictionary<string, List<WriteRequest>>
            {
                { tableName, batch.ToList() }
            });

            var batchResponse = await _dynamoDb.BatchWriteItemAsync(request, cancellationToken);
            LogUnprocessedDeletes(batchResponse);
        }
    }

    private void LogUnprocessedDeletes(BatchWriteItemResponse? batchResponse)
    {
        if (batchResponse?.UnprocessedItems == null || batchResponse.UnprocessedItems.Count == 0)
        {
            return;
        }

        var unprocessedCount = batchResponse.UnprocessedItems.Sum(kv => kv.Value?.Count ?? 0);
        if (unprocessedCount > 0)
        {
            _logger.LogWarning("There are {Count} unprocessed discounted offers during clear", unprocessedCount);
        }
    }
}
