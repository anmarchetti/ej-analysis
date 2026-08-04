using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Interfaces.BoardUpgrades;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.BoardUpgrade;

/// <summary>
/// Repository for managing board upgrades in DynamoDB.
/// </summary>
public class BoardUpgradeRepository : IBoardUpgradeRepository
{
    private readonly AwsSettings _awsSettings;
    private readonly DynamoDBOperationConfig _config;
    private readonly IDynamoDBContext _dynamoDbContext;
    private readonly ILogger<BoardUpgradeRepository> _logger;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;

    /// <summary>
    /// Initializes a new instance of the <see cref="BoardUpgradeRepository"/> class.
    /// </summary>
    /// <param name="dynamoDbContext">The DynamoDB context.</param>
    /// <param name="logger">The logger instance.</param>
    /// <param name="awsSettings">AWS settings.</param>
    /// <param name="cacheService">Cache service instance.</param>
    /// <param name="cacheSettings">Cache settings.</param>
    public BoardUpgradeRepository(IDynamoDBContext dynamoDbContext,
        ILogger<BoardUpgradeRepository> logger,
        IOptions<AwsSettings> awsSettings,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings)
    {
        ArgumentNullException.ThrowIfNull(awsSettings);
        ArgumentNullException.ThrowIfNull(cacheSettings);

        _dynamoDbContext = dynamoDbContext;
        _logger = logger;
        _awsSettings = awsSettings.Value;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings.Value;
        _config = new DynamoDBOperationConfig()
        {
            ConsistentRead = true,
            OverrideTableName = awsSettings.Value.Storage.Tables.BoardUpgrade,
        };
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AccommodationBoardUpgrade>> GetAll()
    {
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.BoardUpgrade, [_cacheSettings.Buckets.BoardUpgrade], async () =>
        {
            try
            {
                var boardUpgrade = new List<AccommodationBoardUpgrade>();

                var asyncSearch =
                    _dynamoDbContext.FromScanAsync<AccommodationBoardUpgrade>(new ScanOperationConfig()
                    {
                        ConsistentRead = true,
                    },
                    _config.ConvertToFromScanConfig());

                while (!asyncSearch.IsDone)
                {
                    var nextSetAsync = await asyncSearch.GetNextSetAsync();
                    boardUpgrade.AddRange(nextSetAsync);
                }

                return boardUpgrade;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to get all board upgrade items from dynamoDb");
                return [new AccommodationBoardUpgrade()]; // Return an empty item for performance reasons to save in the cache
            }
        }, false);
    }

    /// <inheritdoc/>
    public async Task Put(IEnumerable<AccommodationBoardUpgrade> accommodationBoardUpgrade)
    {
        if (accommodationBoardUpgrade is null)
            return;

        var boardUpgrades = accommodationBoardUpgrade.ToList();

        if (boardUpgrades is [])
            return;

        try
        {
            var batchWrite = _dynamoDbContext.CreateBatchWrite<AccommodationBoardUpgrade>(_config.ConvertToBatchWriteConfig());

            batchWrite.AddPutItems(boardUpgrades);

            await batchWrite.ExecuteAsync();
        }
        catch (Exception e)
        {
            _logger.LogError(e,
                "Failed to put: {@AccommodationBoardUpgrade} into dynamoDb {@Table}", accommodationBoardUpgrade, _awsSettings.Storage.Tables.BoardUpgrade);
        }
    }

    /// <inheritdoc/>
    public async Task DeleteAll()
    {
        try
        {
            var batchWrite = _dynamoDbContext.CreateBatchWrite<AccommodationBoardUpgrade>(_config.ConvertToBatchWriteConfig());

            batchWrite.AddDeleteItems(await GetAll());

            await batchWrite.ExecuteAsync();
        }
        catch (Exception e)
        {
            _logger.LogError(e,
                "Failed to delete all items from dynamoDb {@Table}",_awsSettings.Storage.Tables.BoardUpgrade);
        }
    }
}