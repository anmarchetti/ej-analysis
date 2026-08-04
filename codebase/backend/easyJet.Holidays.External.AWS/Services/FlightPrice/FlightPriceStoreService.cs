using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Data.FlightPriceStore;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.AWS.Services.FlightPrice;

/// <inheritdoc cref="IFlightPriceStoreService"/>
public class FlightPriceStoreService : IFlightPriceStoreService
{
    private readonly IDynamoDBContext _dynamoDbContext;
    private readonly DynamoDBOperationConfig _config;
    private readonly ILogger<FlightPriceStoreService> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="dynamoDbContext"></param>
    /// <param name="config"></param>
    /// <param name="logger"></param>
    public FlightPriceStoreService(IDynamoDBContext dynamoDbContext, DynamoDBOperationConfig config, ILogger<FlightPriceStoreService> logger)
    {
        _dynamoDbContext = dynamoDbContext;
        _config = config;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<FlightPriceStoreModel>> GetDailyItems(DateTime referenceDate, string[] currencies)
    {
        var result = new List<FlightPriceStoreModel>();
        var currenciesFilter = currencies.Select(c => new AttributeValue { S = c }).ToList();
        var scanFilter = new ScanFilter();
        // export the whole database every day for flights that have departure date greater than today minus 2 days
        scanFilter.AddCondition(nameof(FlightPriceStoreModel.LocalDepartureDateTime), ScanOperator.GreaterThanOrEqual, referenceDate.Date.AddDays(-2));
        scanFilter.AddCondition(nameof(FlightPriceStoreModel.Currency), ScanOperator.In, currenciesFilter);

        var search = _dynamoDbContext.FromScanAsync<FlightPriceStoreModel>(new ScanOperationConfig
        {
            Filter = scanFilter
        }, _config.ConvertToFromScanConfig());

        while (!search.IsDone)
        {
            var nextSetAsync = await search.GetNextSetAsync();
            result.AddRange(nextSetAsync);
        }

        return result;
    }

    /// <inheritdoc />
    public async Task StorePrices(IEnumerable<FlightPriceStoreModel> models)
    {
        try
        {
            var modelsArray = models.ToArray();
            if (modelsArray is not [])
            {
                foreach (var flightKey in modelsArray.Select(x => x.FlightKey).Distinct())
                {
                    await EvictFlightPrices(flightKey, false);
                }

                var batchWrite = _dynamoDbContext.CreateBatchWrite<FlightPriceStoreModel>(_config.ConvertToBatchWriteConfig());
                batchWrite.AddPutItems(modelsArray);
                await batchWrite.ExecuteAsync();
            }
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Failed to put flight prices into DynamoDB: {EMessage}", e.Message);
            throw new InvalidOperationException("Failed to persist prices", e);
        }
    }

    /// <inheritdoc />
    public async Task<IEnumerable<FlightPriceStoreModel>> EvictFlightPrices(string flightKey, bool updateAvailabilityToZero)
    {
        if (string.IsNullOrEmpty(flightKey))
            return [];

        try
        {
            var search = _dynamoDbContext.FromQueryAsync<FlightPriceStoreModel>(new QueryOperationConfig
            {
                IndexName = "FlightKey-index",
                Limit = 20,
                Filter = new QueryFilter("FlightKey", QueryOperator.Equal, flightKey),
                Select = SelectValues.AllProjectedAttributes
            }, _config.ConvertToFromQueryConfig());

            var existingPrices = await search.GetRemainingAsync();

            if (existingPrices != null && existingPrices is not [])
            {
                var deleteBatch = _dynamoDbContext.CreateBatchWrite<FlightPriceStoreModel>(_config.ConvertToBatchWriteConfig());
                var updateBatch = _dynamoDbContext.CreateBatchWrite<FlightPriceStoreModel>(_config.ConvertToBatchWriteConfig());

                var updatedPrices = new List<FlightPriceStoreModel>();

                foreach (var price in existingPrices)
                {
                    deleteBatch.AddDeleteKey(price.ID, price.UpdateDateTime);
                    if (updateAvailabilityToZero)
                    {
                        var existingFullModel = await _dynamoDbContext.LoadAsync<FlightPriceStoreModel>(price.ID, price.UpdateDateTime, _config.ConvertToLoadConfig());
                        if (existingFullModel != null)
                        {
                            existingFullModel.AvailableInventory = 0;
                            existingFullModel.UpdateDateTime = DateTime.UtcNow;
                            updateBatch.AddPutItem(existingFullModel);

                            updatedPrices.Add(existingFullModel);
                        }
                    }
                }

                await deleteBatch.ExecuteAsync();
                if (updateAvailabilityToZero)
                {
                    await updateBatch.ExecuteAsync();
                    return updatedPrices;
                }
            }
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Can't delete items from table. {EMessage}", e.Message);
            throw new InvalidOperationException("failed to delete", e);
        }

        return [];
    }
}