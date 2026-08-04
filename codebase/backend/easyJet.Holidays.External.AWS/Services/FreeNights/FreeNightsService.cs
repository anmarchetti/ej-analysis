using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.Api.Domain.Services.Cache;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.AWS.Services.FreeNights
{
    public class FreeNightsService : IFreeNightsService
    {
        private readonly AwsSettings _awsSettings;
        private readonly IDynamoDBContext _dynamoDbContext;
        private readonly ILogger<IFreeNightsService> _logger;
        private readonly ICacheService _cacheService;
        private readonly DynamoDBOperationConfig _config;
        private readonly CacheSettings _cacheSettings;

        private const string AllRoomTypesCode = "ALL";

        public FreeNightsService(IDynamoDBContext dynamoDbContext,
            ILogger<IFreeNightsService> logger,
            ICacheService cacheService,
            IOptions<AwsSettings> awsSettings,
            IOptions<CacheSettings> cacheSettings
            )
        {
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _cacheSettings = cacheSettings?.Value ?? throw new ArgumentNullException(nameof(cacheSettings));
            _dynamoDbContext = dynamoDbContext;
            _logger = logger;
            _cacheService = cacheService;
            _config = new DynamoDBOperationConfig()
            {
                ConsistentRead = true,
                OverrideTableName = _awsSettings.Storage.Tables.FreeNights,
            };
        }

        /// <summary>
        /// Get all items from table
        /// </summary>
        /// <returns></returns>
        public async Task<IEnumerable<AccomFreeNights>> GetAll()
        {
            try
            {
                var accomFreeNights = new List<AccomFreeNights>();

                var asyncSearch =
                    _dynamoDbContext.FromScanAsync<AccomFreeNights>(new ScanOperationConfig()
                    {
                        ConsistentRead = true,
                    }, _config.ConvertToFromScanConfig());

                while (!asyncSearch.IsDone)
                {
                    var nextSetAsync = await asyncSearch.GetNextSetAsync();
                    accomFreeNights.AddRange(nextSetAsync);
                }

                return accomFreeNights;
            }
            catch (Exception e)
            {
                _logger.LogError(e, $"Failed to get all items from dynamoDb {_awsSettings.Storage.Tables.FreeNights}");
                return [];
            }
        }

        /// <summary>
        /// Get item by primary key
        /// </summary>
        /// <param name="accomId"></param>
        /// <returns></returns>
        public async Task<AccomFreeNights> Get(string accomId)
        {
            if (string.IsNullOrWhiteSpace(accomId))
            {
                return null;
            }

            var accomFreeNightsFromCache = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.FreeNights, new[] { accomId }, async () =>
            {
                try
                {
                    var accomFreeNights = await _dynamoDbContext.LoadAsync<AccomFreeNights>(accomId, _config.ConvertToLoadConfig());
                    return accomFreeNights ?? new AccomFreeNights(); //for performance (if null, then cache service doesn't save value) 
                }
                catch (Exception e)
                {
                    _logger.LogError(e,
                        $"Failed to get free nights info for accommodation: {accomId} from dynamoDb {_awsSettings.Storage.Tables.FreeNights}");
                    return null;
                }
            }, false);

            return accomFreeNightsFromCache;
        }

        /// <summary>
        /// Put items into table
        /// </summary>
        /// <param name="accomFreeNights"></param>
        /// <returns></returns>
        public async Task Put(IEnumerable<AccomFreeNights> accomFreeNights)
        {
            if (accomFreeNights is null)
                return;

            var freeNights = accomFreeNights.ToList();

            if (freeNights is [])
                return;

            try
            {
                var batchWrite = _dynamoDbContext.CreateBatchWrite<AccomFreeNights>(_config.ConvertToBatchWriteConfig());

                batchWrite.AddPutItems(freeNights);

                await batchWrite.ExecuteAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e,
                    $"Failed to put free nights into dynamoDb {_awsSettings.Storage.Tables.FreeNights}");
                throw;
            }
        }

        /// <summary>
        /// Delete all items from table
        /// </summary>
        /// <returns></returns>
        public async Task DeleteAll()
        {
            try
            {
                var batchWrite = _dynamoDbContext.CreateBatchWrite<AccomFreeNights>(_config.ConvertToBatchWriteConfig());

                //TODO Try to retrieve only primary keys, not entire model
                batchWrite.AddDeleteItems(await GetAll());

                await batchWrite.ExecuteAsync();
            }
            catch (Exception e)
            {
                _logger.LogError(e,
                    $"Failed to delete all items from dynamoDb {_awsSettings.Storage.Tables.FreeNights}");
                throw;
            }
        }

        /// <summary>
        /// Enrich unit models in offer with free nigths promo
        /// </summary>
        /// <param name="offers"></param>
        /// <returns></returns>
        public async Task EnrichWithFreeNightsInfo(IEnumerable<Offer> offers)
        {
            if (offers == null || !offers.Any())
            {
                return;
            }

            var tasks = offers.Select(offer =>
                EnrichWithFreeNightsInfo(offer.Accom.Code, offer.Accom.Date, offer.Accom.Stay, offer.Accom.Unit));

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Enrich unit models with free nigths promo based on conditions
        /// </summary>
        /// <param name="accomCode"></param>
        /// <param name="startDate"></param>
        /// <param name="stay"></param>
        /// <param name="units"></param>
        /// <returns></returns>
        public async Task EnrichWithFreeNightsInfo(string accomCode, DateTime? startDate, byte? stay,
            IEnumerable<Unit> units)
        {
            if (string.IsNullOrWhiteSpace(accomCode) || startDate == null || stay == null || units == null ||
                !units.Any())
            {
                return;
            }

            var tasks = units.Select(async (unit) =>
            {
                var unitFreeNights = await GetFreeNightsInfo(accomCode, unit.Code, startDate.Value, stay.Value);
                unit.FreeNights = unitFreeNights;
            });

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Get free nights info based on conditions
        /// </summary>
        /// <param name="accomCode"></param>
        /// <param name="roomTypeCode"></param>
        /// <param name="startDate"></param>
        /// <param name="stay"></param>
        /// <returns></returns>
        private async Task<FreeNightsInfo> GetFreeNightsInfo(string accomCode, string roomTypeCode, DateTime startDate,
            byte stay)
        {
            var freeNightsInfoFromCache = await _cacheService.GetOrAddAsync(_cacheSettings.Buckets.FreeNights,
                new[] { accomCode, roomTypeCode, startDate.Ticks.ToString(), stay.ToString() },
                () => CalculateFreeNightsInfo(accomCode, roomTypeCode, startDate, stay), false);

            return freeNightsInfoFromCache;
        }

        /// <summary>
        /// Calculate available and included free nights based on conditions
        /// </summary>
        /// <param name="accomCode"></param>
        /// <param name="roomTypeCode"></param>
        /// <param name="startDate"></param>
        /// <param name="stay"></param>
        /// <returns></returns>
        private async Task<FreeNightsInfo> CalculateFreeNightsInfo(string accomCode, string roomTypeCode, DateTime startDate, byte stay)
        {
            if (string.IsNullOrWhiteSpace(roomTypeCode) || stay == 0)
            {
                return null;
            }

            try
            {

                var freeNightsInfo = new FreeNightsInfo();

                var freeNights = (await Get(accomCode))?.AvailableFreeNights;

                if (freeNights == null || !freeNights.Any())
                {
                    return freeNightsInfo; //for performance (if null, then cache service doesn't save value) 
                }

                var includedFreeNights = new List<byte>();

                foreach (var freeNight in freeNights)
                {
                    if (roomTypeCode.Equals(freeNight.RoomCode, StringComparison.InvariantCultureIgnoreCase) ||
                        freeNight.RoomCode.Equals(AllRoomTypesCode, StringComparison.InvariantCultureIgnoreCase))
                    {
                        var offerStartDate = startDate;
                        var offerEndDate = offerStartDate.AddDays(stay);

                        offerStartDate = offerStartDate >= freeNight.TravelStartDate
                            ? offerStartDate
                            : freeNight.TravelStartDate;

                        offerEndDate = offerEndDate <= freeNight.TravelEndDate ? offerEndDate : freeNight.TravelEndDate;

                        var offerDuration = (offerEndDate - offerStartDate).Days;

                        if (offerDuration >= freeNight.CurrentStay && offerDuration >= freeNight.MinStay)
                        {
                            var freeNightsAmount = (byte)(Math.Floor((decimal)offerDuration / freeNight.CurrentStay) *
                                                           freeNight.CurrentFree);
                            includedFreeNights.Add(freeNightsAmount);
                        }
                    }
                }

                freeNightsInfo = new FreeNightsInfo()
                {
                    FreeNightsIncluded = includedFreeNights.Any() ? includedFreeNights.OrderByDescending(b => b).FirstOrDefault() : (byte)0,
                    FreeNightsPromo = freeNights.Where(night =>
                        night.RoomCode.Equals(roomTypeCode, StringComparison.InvariantCultureIgnoreCase) ||
                        night.RoomCode.Equals(AllRoomTypesCode, StringComparison.InvariantCultureIgnoreCase))
                };

                return freeNightsInfo;
            }
            catch (Exception e)
            {
                _logger.LogError(e,
                    $"Failed to enrich with free nights info for: {accomCode}-{startDate}-{stay}-{roomTypeCode}");
                return null;
            }
        }
    }
}