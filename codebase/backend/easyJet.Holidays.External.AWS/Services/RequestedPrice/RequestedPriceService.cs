#nullable enable
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.RequestedPrice;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.RequestedPrice;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.Tests")]
namespace easyJet.Holidays.External.AWS.Services.RequestedPrice;

/// <inheritdoc cref="IRequestedPriceService"/>
public class RequestedPriceService : IRequestedPriceService
{
    internal const int BatchChunkSizeDefault = 25;
    internal const string NoSearchType = "-";

    internal const string Code = "Code";
    internal const string SearchType = "SearchType";
    internal const string SearchCriteria = "SearchCriteria";
    internal const string SearchDate = "SearchDate";
    internal const string Expires = "Expires";
    internal const string PriceByMathFunctions = "PriceByMathFunctions";
    internal const string NamedSearches = "NamedSearches";
    internal const string Currency = "Currency";
    internal const string MarketCodeAndLanguage = "MarketCodeAndLanguage";
    internal const string Transfers = "Transfers";

    private readonly AwsSettings _awsSettings;
    private readonly RequestedPriceTableSetting _tableSettings;
    private readonly ILogger<RequestedPriceService> _logger;
    private readonly IMarketService _marketService;
    private readonly ILanguageService _languageService;
    private readonly IAmazonDynamoDB _dynamoDb;


    /// <summary>
    /// standard ctor
    /// </summary>
    public RequestedPriceService(
        IAmazonDynamoDB dynamoDb,
        IMarketService marketService,
        ILanguageService languageService,
        ILogger<RequestedPriceService> logger,
        IOptions<AwsSettings> awsSettings,
        IOptions<RequestedPriceTableSetting> tableOptions)
    {
        _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        _dynamoDb = dynamoDb;
        _logger = logger;
        _marketService = marketService;
        _languageService = languageService;

        ArgumentNullException.ThrowIfNull(tableOptions);
        _tableSettings = tableOptions.Value;
    }

    /// <inheritdoc />        
    public async Task Save(IDictionary<string, PricesModel> data)
    {
        string searchDate = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var expiresDays = _tableSettings.RecordTtl;
        string expires = DateTimeOffset.UtcNow.AddDays(expiresDays).ToUnixTimeSeconds().ToString();

        _logger.LogInformation("Building put requests, expiration days: {ExpiresDays}", expiresDays);

        var requests = new List<WriteRequest>();
        foreach (var item in data.Values)
        {
            try
            {
                // Summary object
                var summary = item.Summary;

                var attrs = BuildBaseAttrs(summary, true, searchDate, expires);
                attrs[NamedSearches] = new AttributeValue { S = JsonConvert.SerializeObject(summary.NamedSearches) };

                requests.Add(new WriteRequest(new PutRequest(attrs)));

                requests.AddRange((item.NamedSearchPrices ?? new List<RequestedPriceModel>()).Select(x => new WriteRequest(new PutRequest(BuildBaseAttrs(x, false, searchDate, expires)))));

            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to convert item to batch requests for {Geog}", item.Summary.Geog);
            }
        }

        await ProcessBatchRequests(requests);
    }

    /// <inheritdoc />        
    public async Task DeleteOlderThan(long seconds, string marketCodeAndLanguage)
    {
        _logger.LogInformation("Building delete requests, older than: {Seconds} (unix time seconds)", seconds);

        var scanRequest = new ScanRequest
        {
            TableName = _awsSettings.Storage.Tables.RequestedPrice,
            FilterExpression = "#marketcodeandlanguage = :marketcodeandlanguage AND #date < :date",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                {
                    ":date", new AttributeValue
                    {
                        N = seconds.ToString()
                    }
                },
                {
                    ":marketcodeandlanguage", new AttributeValue
                    {
                        S = marketCodeAndLanguage
                    }
                }
            },
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                {
                    "#date", SearchDate
                },
                {
                    "#marketcodeandlanguage", MarketCodeAndLanguage
                }
            }
        };

        var deleteRequests = new List<WriteRequest>();
        Dictionary<string, AttributeValue>? lstEvaluatedKey = null;
        ScanResponse allItemsResponse;
        do
        {
            scanRequest.ExclusiveStartKey = lstEvaluatedKey;

            allItemsResponse = await _dynamoDb.ScanAsync(scanRequest);
            lstEvaluatedKey = allItemsResponse.LastEvaluatedKey;

            foreach (var i in allItemsResponse.Items)
            {
                deleteRequests.Add(new WriteRequest(new DeleteRequest(new Dictionary<string, AttributeValue>
                    {
                        {
                            Code, i[Code]
                        },
                        {
                            SearchType, i[SearchType]
                        }
                    }
                )));
            }

            if (allItemsResponse.Items.Count > 0)
            {
                _logger.LogInformation("Will be deleted: {Items}", string.Join(",", allItemsResponse.Items.Select(item => $"[{item[Code].S} {item[SearchType].S} {item[SearchDate].N}]")));
            }
        } while (allItemsResponse.LastEvaluatedKey?.Count > 0);

        _logger.LogInformation("Found {Count} items to delete", deleteRequests.Count);

        await ProcessBatchRequests(deleteRequests);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<RequestedPriceSummaryModel>> GetPrice(IEnumerable<string> keys)
    {
        try
        {
            var requests = keys.Where(key => !string.IsNullOrWhiteSpace(key)).Select(key =>
            {
                key = key.Trim();

                var parts = key.Split('.');
                var code = parts[0];
                var searchType = parts.Length > 1 ? parts[1] : NoSearchType;
                var marketCodeAndLanguage = $"{_marketService.GetCurrentMarket().Code}|{_languageService.GetCurrentLanguage()}";

                var request = new GetItemRequest
                {
                    TableName = _awsSettings.Storage.Tables.RequestedPrice,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        { Code, new AttributeValue() { S = code } },
                        { SearchType, new AttributeValue() { S = $"{searchType}|{marketCodeAndLanguage}" } },
                    }
                };

                return request;
            }).ToList();

            if (requests.Count == 0)
            {
                return new List<RequestedPriceSummaryModel>();
            }

            var resultTasks = requests.Select(async request =>
            {
                var response = await _dynamoDb.GetItemAsync(request);
                var item = response.Item;
                
                if (item is null or { Count: 0 })
                    return null;

                item.TryGetValue(PriceByMathFunctions, out var priceByMathFunctions);

                item.TryGetValue(SearchCriteria, out var searchCriteria);
                item.TryGetValue(NamedSearches, out var namedSearches);
                item.TryGetValue(Currency, out var currency);
                item.TryGetValue(MarketCodeAndLanguage, out var marketCodeAndLanguage);

                item.TryGetValue(SearchDate, out var searchDateVal);
                long.TryParse(searchDateVal?.N, out var searchDateSeconds);

                item.TryGetValue(Transfers, out var transfers);

                return new RequestedPriceSummaryModel
                {
                    Geog = item[Code].S,
                    RequestedPriceByMathFunctions = string.IsNullOrEmpty(priceByMathFunctions?.S) ? null : JsonConvert.DeserializeObject<Dictionary<RequestedPriceMathFunctionType, RequestedPriceByMathFunctions>>(priceByMathFunctions.S),
                    SearchCriteria = string.IsNullOrEmpty(searchCriteria?.S) ? null : JsonConvert.DeserializeObject<SearchCriteria>(searchCriteria.S),
                    NamedSearches = string.IsNullOrEmpty(namedSearches?.S) ? null : JsonConvert.DeserializeObject<Dictionary<string, decimal>>(namedSearches.S),
                    SearchDate = DateTimeOffset.FromUnixTimeSeconds(searchDateSeconds),
                    Transfers = string.IsNullOrEmpty(transfers?.S) ? null : JsonConvert.DeserializeObject<List<TransferItem>>(transfers.S),
                    Currency = string.IsNullOrEmpty(currency?.S) ? null : currency.S,
                    MarketCodeAndLanguage = string.IsNullOrEmpty(marketCodeAndLanguage?.S) ? null : marketCodeAndLanguage.S,
                };
            }).Where(x => x is not null);

            var results = await Task.WhenAll(resultTasks);

            // getting rid of nulls
            return results.OfType<RequestedPriceSummaryModel>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            throw new ApiException(ApiExceptionCodes.LivePriceGet, null, ex);
        }
    }

#pragma warning disable S3776 // needs actual refactoring
    private async Task ProcessBatchRequests(ICollection<WriteRequest> requests, int attemptNumber = 1)
    {
#pragma warning restore S3776
        if (attemptNumber <= _tableSettings.RetryAttempts)
        {
            _logger.LogInformation("Writing data into {TableName}. Attempt number: {AttemptNumber}. Max number of attempts: {RetryAttempts}", _tableSettings.TableName, attemptNumber, _tableSettings.RetryAttempts);
            var chunkSize = GetChunkSize();
            var chunks = requests.Split(chunkSize).ToList(); // Batch write chunk size

            _logger.LogInformation("Starting processing batch request, chunk size: {Size}, chunks: {Count}", chunkSize, chunks.Count);

            var unprocessedItems = new List<Dictionary<string, List<WriteRequest>>>();

            for (var i = 0; i < chunks.Count; i++)
            {
                try
                {
                    var chunk = chunks[i];

                    var batchWriteItemResponse = await _dynamoDb.BatchWriteItemAsync(new BatchWriteItemRequest(
                        new()
                        {
                            { _tableSettings.TableName, chunk.ToList() }
                        })
                    );

                    if (batchWriteItemResponse?.UnprocessedItems?.Values.Any() ?? false)
                    {
                        unprocessedItems.Add(batchWriteItemResponse.UnprocessedItems);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process chunk {I} of {Count}", i + 1, chunks.Count);
                }
            }

            if (unprocessedItems is not [])
            {
                var unprocessedItemsList = unprocessedItems.SelectMany(dictionary => dictionary.Values).SelectMany(list => list).ToList();
                _logger.LogWarning("There are unprocessed items. Count: {Count}", unprocessedItemsList.Count);

                if (_tableSettings.WaitMsBeforeReWriteUnprocessedItems > 0)
                {
                    _logger.LogWarning("Sleep: {Mls} ms", _tableSettings.WaitMsBeforeReWriteUnprocessedItems);
                    await Task.Delay(_tableSettings.WaitMsBeforeReWriteUnprocessedItems);
                }

                _logger.LogWarning("Retrying to write unprocessed items");
                await ProcessBatchRequests(unprocessedItemsList, attemptNumber + 1);
            }
        }
        else
        {
            _logger.LogWarning("Attempts to write data to {TableName} ended", _tableSettings.TableName);
        }
    }

    private int GetChunkSize()
    {
        return _tableSettings.ChunkSize > 0 ? _tableSettings.ChunkSize : BatchChunkSizeDefault;
    }


    /// <summary>
    /// Build attributes map to save in DynamoDB
    /// </summary>
    /// <param name="model"></param>
    /// <param name="isSummary"></param>
    /// <param name="searchDate"></param>
    /// <param name="expires"></param>
    /// <returns></returns>
    private Dictionary<string, AttributeValue> BuildBaseAttrs(RequestedPriceModel model, bool isSummary, string searchDate, string expires)
    {
        var map = new Dictionary<string, AttributeValue>
        { 
            // Key and sort key
            {Code, new AttributeValue { S = !string.IsNullOrEmpty(model.Geog) ? model.Geog.Split('|')[0].Trim() : null} },
            {SearchType, new AttributeValue { S = isSummary ? $"{NoSearchType}|{model.MarketCodeAndLanguage}" : model.SearchCriteria.Id} },
            // Other fields
            {SearchCriteria, new AttributeValue { S = JsonConvert.SerializeObject(model.SearchCriteria)} },
            {SearchDate, new AttributeValue { N = searchDate } },
            {Expires, new AttributeValue { N = expires} },
            {Currency, new AttributeValue { S = model.Currency} },
            {MarketCodeAndLanguage, new AttributeValue { S = model.MarketCodeAndLanguage} },
            {PriceByMathFunctions, new AttributeValue { S = JsonConvert.SerializeObject(model.RequestedPriceByMathFunctions)} },
            {Transfers, new AttributeValue { S = JsonConvert.SerializeObject(model.Transfers)} },
        };

        return map;
    }
}