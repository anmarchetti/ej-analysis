using System.Globalization;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PointsOfInterest.Models;

namespace PointsOfInterest.Ancillaries;

internal interface IPointOfInterestRepository
{
    Task RefreshResortPoiByResorts(List<Resort> resorts);
}

internal sealed class PointOfInterestRepository : IPointOfInterestRepository
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private readonly ILogger<PointOfInterestRepository> _logger;
    private readonly AwsPlacesDynamoOptions _config;
    private static readonly JsonSerializerOptions jsonSerializerOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    private const int DynamoBatchSize = 25; // DynamoDB BatchWrite limit
    private const int MaxDeleteRetries = 5;
    private const int InitialRetryDelayMs = 200;

    public PointOfInterestRepository(ILogger<PointOfInterestRepository> logger,
        IAmazonDynamoDB dynamoClient,
        IOptions<AwsPlacesDynamoOptions> options)
    {
        _dynamoClient = dynamoClient; 
        _logger = logger;
        _config = options.Value ?? throw new ArgumentNullException(nameof(options));
    }

    public async Task RefreshResortPoiByResorts(List<Resort> resorts)
    {
        var totalPois = resorts.Sum(r => r.PointsOfInterests?.Count ?? 0);
        _logger.LogInformation("Refreshing POIs for {ResortCount} resorts. Writing {TotalPois} POIs to DynamoDB as individual items", resorts.Count, totalPois);

        await DeleteItemsByResortCode(resorts.Select(r => r.ResortCode));

        List<WriteRequest> writeBuffer = new(DynamoBatchSize);

        foreach (var resort in resorts)
        {
            if (resort.PointsOfInterests == null || resort.PointsOfInterests.Count == 0)
                continue;

            foreach (var poi in resort.PointsOfInterests)
            {
                var item = new Dictionary<string, AttributeValue>(StringComparer.OrdinalIgnoreCase);

                BuildPoiData(poi, item);

                item["Id"] = new AttributeValue { S = Guid.NewGuid().ToString() };
                item[nameof(resort.ResortCode)] = new AttributeValue { S = resort.ResortCode ?? string.Empty };
                item[nameof(resort.ResortName)] = new AttributeValue { S = resort.ResortName ?? string.Empty };
                item["CreatedAt"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") };
                item["Hidden"] = new AttributeValue { BOOL = false };
                item["Keep"] = new AttributeValue { BOOL = false };
                item[nameof(resort.QueryPositionLatitude)] = new AttributeValue { N = resort.QueryPositionLatitude.ToString(CultureInfo.InvariantCulture) };
                item[nameof(resort.QueryPositionLongitude)] = new AttributeValue { N = resort.QueryPositionLongitude.ToString(CultureInfo.InvariantCulture) };

                writeBuffer.Add(new WriteRequest
                {
                    PutRequest = new PutRequest { Item = item }
                });

                if (writeBuffer.Count == DynamoBatchSize)
                    await FlushBuffer(writeBuffer);
            }
        }

        await FlushBuffer(writeBuffer);
    }

    internal static void BuildPoiData(PointOfInterest poi, Dictionary<string, AttributeValue> item, Dictionary<string, AttributeValue>? poiMapOverride = null)
    {
        var poiMap = poiMapOverride ?? ConvertObjectToMap(poi);

        foreach (var kvp in poiMap)
        {
            if (kvp.Key is "Id" or "id" or nameof(Resort.ResortCode) or nameof(Resort.ResortName) or "CreatedAt" or "Hidden" or "Keep" or nameof(Resort.QueryPositionLatitude) 
                or nameof(Resort.QueryPositionLongitude))
                continue;
            item[kvp.Key] = kvp.Value;
        }
    }

    private async Task FlushBuffer(List<WriteRequest> writeBuffer, CancellationToken ct = default)
    {
        if (writeBuffer.Count == 0) return;

        var request = new BatchWriteItemRequest
        {
            RequestItems = new Dictionary<string, List<WriteRequest>>
            {
                [_config.PointOfInterestTableName] = new List<WriteRequest>(writeBuffer)
            }
        };

        await _dynamoClient.BatchWriteItemAsync(request, ct);
        writeBuffer.Clear();
    }

    private async Task DeleteItemsByResortCode(IEnumerable<string> resortCodes, CancellationToken cancellationToken = default)
    {
        var codes = resortCodes.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (codes.Count == 0)
        {
            _logger.LogInformation("No resort codes supplied for deletion; skipping delete phase.");
            return;
        }

        _logger.LogInformation("Starting targeted purge for {Count} resort codes in table {Table}", codes.Count, _config.PointOfInterestTableName);

        int totalDeleted = 0;
        foreach (var code in codes)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var itemsForCode = await QueryKeysForResort(code, cancellationToken);
            if (itemsForCode.Count == 0) continue;

            foreach (var batch in BuildDeleteBatches(itemsForCode, DynamoBatchSize))
            {
                var batchRequest = new BatchWriteItemRequest
                {
                    RequestItems = new Dictionary<string, List<WriteRequest>>
                    {
                        [_config.PointOfInterestTableName] = batch
                    }
                };
                await ExecuteWithRetries(batchRequest, _config.PointOfInterestTableName, cancellationToken);
                totalDeleted += batch.Count;
            }
        }

        _logger.LogInformation("Completed targeted purge. Deleted {TotalDeleted} items across {ResortCount} resort codes from {Table}", totalDeleted, codes.Count, _config.PointOfInterestTableName);
    }

    private async Task<List<Dictionary<string, AttributeValue>>> QueryKeysForResort(string resortCode, CancellationToken ct)
    {
        var results = new List<Dictionary<string, AttributeValue>>();
        Dictionary<string, AttributeValue>? lastKey = null;
        do
        {
            var request = new QueryRequest
            {
                TableName = _config.PointOfInterestTableName,
                KeyConditionExpression = "ResortCode = :rc",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":rc"] = new AttributeValue { S = resortCode }
                },
                ProjectionExpression = $"{nameof(Resort.ResortCode)}, {nameof(PointOfInterest.PlaceId)}, Keep",
                ExclusiveStartKey = lastKey
            };

            var response = await _dynamoClient.QueryAsync(request, ct);
            if (response.Items != null && response.Items.Count > 0)
                results.AddRange(response.Items);
            lastKey = response.LastEvaluatedKey;
        } while (HasMore(lastKey));

        return results;
    }

    private static bool HasMore(Dictionary<string, AttributeValue>? key) => key is { Count: > 0 };

    private IEnumerable<List<WriteRequest>> BuildDeleteBatches(List<Dictionary<string, AttributeValue>> items, int batchSize)
    {
        var current = new List<WriteRequest>(batchSize);
        foreach (var item in items)
        {
            if (!TryBuildDelete(item, out var wr))
                continue;

            current.Add(wr);
            if (current.Count == batchSize)
            {
                yield return current;
                current = new List<WriteRequest>(batchSize);
            }
        }
        if (current.Count > 0)
            yield return current;
    }

    private bool TryBuildDelete(Dictionary<string, AttributeValue> item, out WriteRequest request)
    {
        request = null!;
        if (!item.TryGetValue("ResortCode", out var resortCodeAttr) || !item.TryGetValue(nameof(PointOfInterest.PlaceId), out var placeIdAttr))
        {
            _logger.LogWarning("Skipping item missing composite key attributes (ResortCode/PlaceId)");
            return false;
        }

        if (ShouldKeep(item))
        {
            _logger.LogDebug("Skipping deletion for {ResortCode}/{PlaceId} because Keep flag is true",
                resortCodeAttr.S, placeIdAttr.S);
            return false;
        }

        request = new WriteRequest
        {
            DeleteRequest = new DeleteRequest
            {
                Key = new Dictionary<string, AttributeValue>
                {
                    [nameof(Resort.ResortCode)] = resortCodeAttr,
                    [nameof(PointOfInterest.PlaceId)] = placeIdAttr
                }
            }
        };
        return true;
    }

    private static bool ShouldKeep(Dictionary<string, AttributeValue> item)
    {
        if (!item.TryGetValue("Keep", out var keepAttr))
            return false;

        if (keepAttr.NULL == true)
            return false;

        if (keepAttr.BOOL == true)
            return true;

        return false;
    }

    private async Task ExecuteWithRetries(BatchWriteItemRequest request, string tableName, CancellationToken ct)
    {
        int attempt = 0;
        int delayMs = InitialRetryDelayMs;

        var unprocessed = request.RequestItems;

        do
        {
            ct.ThrowIfCancellationRequested();

            var response = await _dynamoClient.BatchWriteItemAsync(new BatchWriteItemRequest
            {
                RequestItems = unprocessed
            }, ct);

            unprocessed = response.UnprocessedItems;

            if (unprocessed.Count == 0)
                return;

            attempt++;
            _logger.LogWarning("Unprocessed delete requests detected (Attempt {Attempt}/{Max}). Retrying after {Delay}ms.",
                attempt, MaxDeleteRetries, delayMs);

            await Task.Delay(delayMs, ct);
            delayMs *= 2;
        }
        while (attempt < MaxDeleteRetries); 

        var remaining = unprocessed.Values.Sum(v => v.Count);
        _logger.LogError("Failed to delete {Remaining} items from {Table} after {Attempts} attempts.", remaining, tableName, attempt);
    }

    private static Dictionary<string, AttributeValue> ConvertObjectToMap<T>(T obj)
    {
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(obj, jsonSerializerOptions));
        return JsonElementToMap(doc.RootElement);
    }

    private static Dictionary<string, AttributeValue> JsonElementToMap(JsonElement element)
    {
        var map = new Dictionary<string, AttributeValue>(StringComparer.OrdinalIgnoreCase);
        foreach (var prop in element.EnumerateObject())
        {
            map[prop.Name] = FromJsonElement(prop.Value);
        }
        return map;
    }

    internal static AttributeValue FromJsonElement(JsonElement el)
    {
        return el.ValueKind switch
        {
            JsonValueKind.Object => new AttributeValue { M = JsonElementToMap(el) },
            JsonValueKind.Array  => new AttributeValue
            {
                L = el.EnumerateArray().Select(FromJsonElement).ToList()
            },
            JsonValueKind.String => new AttributeValue { S = el.GetString() },
            JsonValueKind.Number => new AttributeValue
            {
                N = el.TryGetInt64(out var l) ? l.ToString(CultureInfo.InvariantCulture)
                    : el.GetDouble().ToString(CultureInfo.InvariantCulture)
            },
            JsonValueKind.True   => new AttributeValue { BOOL = true },
            JsonValueKind.False  => new AttributeValue { BOOL = false },
            JsonValueKind.Null   => new AttributeValue { NULL = true },
            _ => new AttributeValue { S = el.ToString() }
        };
    }
}
