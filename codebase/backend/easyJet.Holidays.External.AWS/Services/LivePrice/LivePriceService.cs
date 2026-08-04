#nullable enable
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.LivePrice;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.Market;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using easyJet.Holidays.External.AWS.Utils;
using Polly;
using Polly.Registry;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.Services.LivePrice;

/// <inheritdoc cref="ILivePriceService"/>
public class LivePriceService : ILivePriceService
{
    private const int BatchChunkSizeDefault = 25;
    private const string NoSearchType = "-";

    private const string AccomCode = "AccomCode";
    private const string Code = "Code";
    private const string PackageId = "PackageId";
    private const string SearchType = "SearchType";
    private const string SearchCriteria = "SearchCriteria";
    private const string SearchDate = "SearchDate";
    private const string Expires = "Expires";
    private const string Currency = "Currency";
    private const string Market = "Market";
    private const string Language = "Language";
    private const string Price = "Price";
    private const string PricePP = "PricePP";
    private const string TouristTax = "TouristTax";
    private const string TouristTaxPP = "TouristTaxPP";
    private const string NamedSearches = "NamedSearches";
    private const string Transfers = "Transfers";
    private const string ExtraLuggageInfo = "ExtraLuggageInfo";
    private const string OutboundAirport = "OutboundAirport";
    private const string InboundAirport = "InboundAirport";
    private const string OutboundRouteId = "OutboundRouteId";
    private const string InboundRouteId = "InboundRouteId";
    private const string UnitCode = "UnitCode";
    private const string BoardCode = "BoardCode";
    private const string PromoCollections = "PromoCollections";
    private const string Prom = "Prom";
    private const string TaxesAndFees = nameof(TaxesAndFees);
    private const string PriceExcludingTouristTax = nameof(PriceExcludingTouristTax);
    private const string PricePPExcludingTouristTax = nameof(PricePPExcludingTouristTax);

    private readonly AwsSettings _awsSettings;
    private readonly AwsClient _awsClient;
    private readonly ILogger<LivePriceService> _logger;
    private readonly IMarketService _marketService;
    private readonly ILanguageService _languageService;
    private readonly ResiliencePipeline<BatchWriteItemResponse> _batchWriter;

    


    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="awsClient"></param>
    /// <param name="awsSettings"></param>
    /// <param name="logger"></param>
    /// <param name="marketService"></param>
    /// <param name="languageService"></param>
    /// <param name="pipelineProvider"></param>
    /// <exception cref="ArgumentNullException"></exception>
    public LivePriceService(
        AwsClient awsClient,
        IOptions<AwsSettings> awsSettings,
        ILogger<LivePriceService> logger,
        IMarketService marketService,
        ILanguageService languageService,
        ResiliencePipelineProvider<string> pipelineProvider)
    {
        ArgumentNullException.ThrowIfNull(pipelineProvider);

        _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
        _awsClient = awsClient;
        _logger = logger;
        _marketService = marketService;
        _languageService = languageService;
        _batchWriter = pipelineProvider.GetPipeline<BatchWriteItemResponse>(AwsConfigurationExtensions.DynamoDbBatchWritePipelineKey);
    }

    /// <inheritdoc />
    public async Task Save(LivePriceTableSetting settings, Dictionary<string, GeogPricesModel> data, int expiresDays)
    {
        string searchDate = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        string expires = DateTimeOffset.UtcNow.AddDays(expiresDays).ToUnixTimeSeconds().ToString();

        _logger.LogInformation("Building put requests, expiration days: {ExpiresDays}", expiresDays);

        var requests = new List<WriteRequest>();
        foreach (var item in data.Values)
        {
            try
            {
                requests.AddRange(item.Summaries.Select(summary =>
                {
                    var attrs = BuildSummaryAttributes(summary, searchDate, expires);
                    return new WriteRequest(new PutRequest(attrs));
                }));
                requests.AddRange((item.NamedSearchPrices ?? new List<LivePriceModel>()).Select(x => new WriteRequest(new PutRequest(BuildAttributes(x, searchDate, expires)))));
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Failed to convert item to batch requests for {Geog}", item.Summaries.First().Geog);
            }
        }

        using (var client = GetClientForSave(settings))
        {
            await ProcessBatchRequests(client, settings, requests);
        }
    }

    /// <inheritdoc />
    public async Task DeleteOlderThan(LivePriceTableSetting settings, long seconds, string market)
    {
        _logger.LogInformation("Building delete requests, older than: {Seconds} (unix time seconds)", seconds);

        var tableName = settings.TableName;
        using (var client = GetClientForSave(settings))
        {
            var scanRequest = new ScanRequest
            {
                TableName = tableName,
                FilterExpression = "#col < :ver AND #market = :market",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    {
                        ":ver", new AttributeValue
                        {
                            N = seconds.ToString()
                        }
                    },
                    {
                        ":market",
                        new AttributeValue
                        {
                            S = market
                        }
                    }
                },
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    {
                        "#col", SearchDate
                    },
                    {
                        "#market", Market
                    }
                }
            };

            var deleteRequests = new List<WriteRequest>();
            Dictionary<string, AttributeValue>? lstEvaluatedKey = null;
            ScanResponse allItemsResponse;
            do
            {
                scanRequest.ExclusiveStartKey = lstEvaluatedKey;

                allItemsResponse = await client.ScanAsync(scanRequest);
                lstEvaluatedKey = allItemsResponse.LastEvaluatedKey;

                foreach (var i in allItemsResponse.Items)
                {
                    deleteRequests.Add(new(new DeleteRequest(new()
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
            } while (allItemsResponse.LastEvaluatedKey?.Count > 0);

            _logger.LogInformation("Found {Count} items to delete", deleteRequests.Count);

            await ProcessBatchRequests(client, settings, deleteRequests);
        }
    }

    /// <summary>
    /// Special for save: it allows to build client without access keys. It's used for functions inside AWS (e.g. lambdas)
    /// </summary>
    /// <param name="settings"></param>
    /// <returns></returns>
    public virtual IAmazonDynamoDB GetClientForSave(LivePriceTableSetting settings)
    {
        return AwsClient.GetImplicitClient(settings.Region);
    }

    /// <summary>
    /// Build attributes map to save in DynamoDB
    /// </summary>
    /// <param name="model"></param>
    /// <param name="searchDate"></param>
    /// <param name="expires"></param>
    /// <returns></returns>
    private Dictionary<string, AttributeValue> BuildSummaryAttributes(LivePriceSummaryModel model, string searchDate, string expires)
    {
        var attributes = BuildAttributes(model, searchDate, expires);
        attributes[SearchType] = new AttributeValue { S = $"{NoSearchType}|{model.Market}|{model.Language}" };
        attributes[NamedSearches] = new AttributeValue { S = JsonConvert.SerializeObject(model.NamedSearches) };
        return attributes;
    }
    private Dictionary<string, AttributeValue> BuildAttributes(LivePriceModel model, string searchDate, string expires)
    {
        var map = new Dictionary<string, AttributeValue>
        {
            // Key and sort key
            {Code, new AttributeValue { S = model.Geog} },
            {SearchType, new AttributeValue { S = $"{model.SearchCriteria.Name}|{model.Market}|{model.Language}" } },
            // Other fields
            {PackageId, new AttributeValue { S = model.PackageId} },
            {SearchCriteria, new AttributeValue { S = JsonConvert.SerializeObject(model.SearchCriteria)} },
            {SearchDate, new AttributeValue { N = searchDate } },
            {Expires, new AttributeValue { N = expires} },
            {Currency, new AttributeValue { S = model.Currency} },
            {Market, new AttributeValue { S = model.Market} },
            {Language, new AttributeValue { S = model.Language} },
            {Price, new AttributeValue { N = model.Price.ToString(CultureInfo.InvariantCulture)} },
            {PricePP, new AttributeValue { N = model.PricePP.ToString(CultureInfo.InvariantCulture)} },
            {Transfers, new AttributeValue { S = JsonConvert.SerializeObject(model.Transfers)} },
            {AccomCode, new AttributeValue { S = model.AccomCode}},
            {ExtraLuggageInfo, new AttributeValue { S = JsonConvert.SerializeObject(model.ExtraLuggageInfo)}},
            {OutboundAirport, new AttributeValue { S = model.OutboundAirport}},
            {InboundAirport, new AttributeValue { S = model.InboundAirport}},
            {OutboundRouteId, new AttributeValue { S = model.OutboundRouteId}},
            {InboundRouteId, new AttributeValue { S = model.InboundRouteId}},
            {UnitCode, new AttributeValue { S = model.UnitCode}},
            {BoardCode, new AttributeValue { S = model.BoardCode}},
            {PromoCollections, new AttributeValue { S = JsonConvert.SerializeObject(model.PromotionCollections) }},
            {Prom, new AttributeValue { S = model.Prom }},
            {TouristTax, new AttributeValue { N = model.TouristTax.ToString(CultureInfo.InvariantCulture)} },
            {TouristTaxPP, new AttributeValue { N = model.TouristTaxPP.ToString(CultureInfo.InvariantCulture)} },
            {PriceExcludingTouristTax, new AttributeValue { N = model.PriceExcludingTouristTax.ToString(CultureInfo.InvariantCulture)} },
            {PricePPExcludingTouristTax, new AttributeValue { N = model.PricePPExcludingTouristTax.ToString(CultureInfo.InvariantCulture)} },
            {TaxesAndFees, new AttributeValue { S = JsonConvert.SerializeObject(model.TaxesAndFees) }},
        };

        return map;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<LivePriceSummaryModel>> GetPrice(IEnumerable<string> keys)
    {
        try
        {
            var requests = keys.Where(key => !string.IsNullOrWhiteSpace(key)).Select(async key =>
            {
                key = key.Trim();

                var parts = key.Split('.');
                var code = parts[0];
                var searchType = parts.Length > 1 ? parts[1] : NoSearchType;
                var marketCode = _marketService.GetCurrentMarket().Code;
                var language = _languageService.GetCurrentLanguage();

                var request = new GetItemRequest
                {
                    TableName = _awsSettings.Storage.Tables.LivePrice,
                    Key = new()
                    {
                        { Code, new() { S = code } },
                        { SearchType, new() { S = $"{searchType}|{marketCode}|{language}" } },
                    }
                };
                Dictionary<string, AttributeValue> result;
                using (var client = _awsClient.GetClient())
                {

                    var response = await client.GetItemAsync(request);
                    result = response.Item;
                }

                if (result is null or { Count: 0 })
                    return null;

                return MapLivePriceOffer(result);
            }).Where(request => request is not null);

            var requestsResult = await Task.WhenAll(requests);
            return requestsResult.OfType<LivePriceSummaryModel>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            throw new ApiException(ApiExceptionCodes.LivePriceGet, null, ex);
        }
    }

    private LivePriceSummaryModel MapLivePriceOffer(Dictionary<string, AttributeValue> atts)
    {
        atts.TryGetValue(Currency, out var currency);
        atts.TryGetValue(Market, out var market);

        atts.TryGetValue(Price, out var priceVal);
        decimal.TryParse(priceVal?.N, CultureInfo.InvariantCulture, out var price);

        atts.TryGetValue(PricePP, out var pricePpVal);
        decimal.TryParse(pricePpVal?.N, CultureInfo.InvariantCulture, out var pricePP);

        atts.TryGetValue(TouristTax, out var touristTaxVal);
        decimal.TryParse(touristTaxVal?.N, CultureInfo.InvariantCulture, out var touristTax);

        atts.TryGetValue(TouristTaxPP, out var touristTaxPPVal);
        decimal.TryParse(touristTaxPPVal?.N, CultureInfo.InvariantCulture, out var touristTaxPP);

        atts.TryGetValue(PriceExcludingTouristTax, out var priceExcludingTouristTaxVal);
        decimal.TryParse(priceExcludingTouristTaxVal?.N, CultureInfo.InvariantCulture, out var priceExcludingTouristTax );
        
        atts.TryGetValue(PricePPExcludingTouristTax, out var pricePPExcludingTouristTaxVal);
        decimal.TryParse(pricePPExcludingTouristTaxVal?.N, CultureInfo.InvariantCulture, out var pricePPExcludingTouristTax );
            
        atts.TryGetValue(SearchCriteria, out var searchCriteria);
        atts.TryGetValue(NamedSearches, out var namedSearches);

        atts.TryGetValue(SearchDate, out var searchDateVal);
        long.TryParse(searchDateVal?.N, out var searchDateSeconds);

        atts.TryGetValue(Transfers, out var transfers);
        atts.TryGetValue(PromoCollections, out var promoCollections);
        atts.TryGetValue(TaxesAndFees, out var taxesAndFees);
        atts.TryGetValue(AccomCode, out var accomCode);
        atts.TryGetValue(ExtraLuggageInfo, out var extraLuggageInfo);

        var livePriceSummaryModel = new LivePriceSummaryModel
        {
            PackageId = atts[PackageId].S,
            Geog = atts[Code].S,
            Price = price,
            PricePP = pricePP,
            SearchCriteria = string.IsNullOrEmpty(searchCriteria?.S) ? null : JsonConvert.DeserializeObject<SearchCriteria>(searchCriteria.S),
            NamedSearches = string.IsNullOrEmpty(namedSearches?.S) ? null : JsonConvert.DeserializeObject<Dictionary<string, decimal>>(namedSearches.S),
            SearchDate = DateTimeOffset.FromUnixTimeSeconds(searchDateSeconds),
            Transfers = string.IsNullOrEmpty(transfers?.S) ? null : JsonConvert.DeserializeObject<List<TransferItem>>(transfers.S),
            Currency = currency?.S,
            Market = market?.S,
            AccomCode = accomCode?.S,
            ExtraLuggageInfo = string.IsNullOrEmpty(extraLuggageInfo?.S) ? null : JsonConvert.DeserializeObject<ExtraLuggageInfo>(extraLuggageInfo.S),
            OutboundAirport = atts.GetValueOrDefault(OutboundAirport)?.S,
            InboundAirport = atts.GetValueOrDefault(InboundAirport)?.S,
            OutboundRouteId = atts.GetValueOrDefault(OutboundRouteId)?.S,
            InboundRouteId = atts.GetValueOrDefault(InboundRouteId)?.S,
            UnitCode = atts.GetValueOrDefault(UnitCode)?.S,
            BoardCode = atts.GetValueOrDefault(BoardCode)?.S,
            PromotionCollections= string.IsNullOrEmpty(promoCollections?.S) ? null : JsonConvert.DeserializeObject<List<string>>(promoCollections.S),
            Prom = atts.GetValueOrDefault(Prom)?.S,
            TouristTax = touristTax,
            TouristTaxPP = touristTaxPP,
            PricePPExcludingTouristTax = pricePPExcludingTouristTax,
            PriceExcludingTouristTax = priceExcludingTouristTax,
            TaxesAndFees = string.IsNullOrEmpty(taxesAndFees?.S) ? null : JsonConvert.DeserializeObject<IReadOnlyDictionary<string, TaxesAndFeesSummary>>(taxesAndFees.S),

        };

        return livePriceSummaryModel;
    }

    private async Task ProcessBatchRequests(IAmazonDynamoDB client, LivePriceTableSetting settings, ICollection<WriteRequest> requests)
    {

        var chunkSize = settings.ChunkSize > 0 ? settings.ChunkSize : BatchChunkSizeDefault;
        var chunks = requests.Split(chunkSize).ToList(); // Batch write chunk size

        _logger.LogInformation("Starting processing batch request, chunk size: {ChunkSize}, chunks: {Count}", chunkSize, chunks.Count);

        for (var i = 0; i < chunks.Count; i++)
        {
            try
            {
                var chunk = chunks[i].ToList();

                await _batchWriter.WriteAsync(client, new BatchWriteItemRequest(new Dictionary<string, List<WriteRequest>>
                {
                    { settings.TableName, chunk }
                }));

                _logger.LogInformation("Processed chunk {I} of {Count}", i + 1, chunks.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process chunk {I} of {Count}", i + 1, chunks.Count);
            }
        }
    }
}