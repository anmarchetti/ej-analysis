using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Interfaces.DiscountedOffer;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.DiscountedOffers;

/// <summary>
/// Offer discount repository for managing discounted offers in DynamoDB.
/// </summary>
public class HbgHotelDiscountsRepository : IHbgHotelDiscountsRepository
{
    private readonly DynamoDBOperationConfig _config;
    private readonly IDynamoDBContext _dynamoDbContext;
    private readonly ILogger<HbgHotelDiscountsRepository> _logger;
    private readonly ICacheService _cacheService;
    private readonly CacheSettings _cacheSettings;

    /// <summary>
    /// Constructor for OfferDiscountRepository.
    /// </summary>
    /// <param name="dynamoDbContext"></param>
    /// <param name="logger"></param>
    /// <param name="awsSettings"></param>
    /// <param name="cacheService"></param>
    /// <param name="cacheSettings"></param>
    public HbgHotelDiscountsRepository(IDynamoDBContext dynamoDbContext,
        ILogger<HbgHotelDiscountsRepository> logger,
        IOptions<AwsSettings> awsSettings,
        ICacheService cacheService,
        IOptions<CacheSettings> cacheSettings)

    {
        ArgumentNullException.ThrowIfNull(awsSettings);
        ArgumentNullException.ThrowIfNull(cacheSettings);

        _dynamoDbContext = dynamoDbContext;
        _logger = logger;
        _cacheService = cacheService;
        _cacheSettings = cacheSettings.Value;
        _config = new DynamoDBOperationConfig()
        {
            ConsistentRead = true,
            OverrideTableName = awsSettings.Value.Storage.Tables.OfferDiscount,
        };

    }

    /// <inheritdoc/>
    public async Task<List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>> GetAll()
    {
        return await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.OfferDiscount, [_cacheSettings.Buckets.OfferDiscount], async () =>
        {
            try
            {
                var discountedOffers = new List<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>();

                var asyncSearch =
                    _dynamoDbContext.FromScanAsync<Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount>(new ScanOperationConfig()
                    {
                        ConsistentRead = true,
                    },
                    _config.ConvertToFromScanConfig());

                while (!asyncSearch.IsDone)
                {
                    var nextSetAsync = await asyncSearch.GetNextSetAsync();
                    discountedOffers.AddRange(nextSetAsync);
                }

                return discountedOffers;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to get all offer discount items from dynamoDb");
                return [new Api.Domain.Data.DynamoDB.DiscountedOffer.HbgHotelDiscount()]; // Return an empty item for performance reasons to save in the cache
            }
        }, false);
    }
}