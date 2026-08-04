using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Repositories;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.Api.Domain.Utils.Aws;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.Api.Domain.Repositories
{

    /// <summary>
    /// AWS DynamoDB repository
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class AWSDBRepository<T> : IAWSDbRepository<T> where T : class
    {
        private readonly IDynamoDBContext _dbContext;
        private readonly DynamoDBOperationConfig _config;
        private readonly ILogger<IAWSDbRepository<T>> _logger;

        /// <summary>
        /// AWS DynamoDB repository ctor
        /// </summary>
        /// <param name="dbContext"></param>
        /// <param name="config"></param>
        /// <param name="logger"></param>
        public AWSDBRepository(IDynamoDBContext dbContext, DynamoDBOperationConfig config, ILogger<IAWSDbRepository<T>> logger)
        {
            _dbContext = dbContext;
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Get items by hash keys. Use only if table has hash key.
        /// </summary>
        /// <param name="hashKeys"></param>
        /// <returns></returns>
        public async Task<IEnumerable<T>> GetAsync(IEnumerable<object> hashKeys)
        {
            var hashKeyList = hashKeys.ToList();

            try
            {
                var batch = _dbContext.CreateBatchGet<T>(_config.ConvertToBatchGetConfig());
                foreach (var hashKey in hashKeyList)
                {
                    batch.AddKey(hashKey);
                }

                await batch.ExecuteAsync();
                return batch.Results;
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't get items with hashKey: {string.Join(",", hashKeyList)} from table: {_config?.OverrideTableName}");
                return new List<T>();
            }
        }

        /// <summary>
        /// Get items by hash key. Use only if table has hash key and range key.
        /// </summary>
        /// <param name="hashKey"></param>
        /// <returns></returns>
        public async Task<IEnumerable<T>> GetAsync(object hashKey)
        {
            try
            {
                var search = _dbContext.QueryAsync<T>(hashKey, _config.ConvertToQueryConfig());
                
                var results = await search.GetRemainingAsync();

                return results;
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't get items with hashKey: {hashKey} from table: {_config?.OverrideTableName}");
                return new List<T>();
            }
        }

        /// <summary>
        /// Get item by hash key and range key.
        /// </summary>
        /// <param name="hashKey"></param>
        /// <param name="rangeKey"></param>
        /// <returns></returns>
        public async Task<T> GetAsync(object hashKey, object rangeKey)
        {
            try
            {
                return await _dbContext.LoadAsync<T>(hashKey, rangeKey, _config.ConvertToLoadConfig());
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't get item with hashKey: {hashKey} and rangeKey: {rangeKey} from table: {_config?.OverrideTableName}");
                return default;
            }
        }

        /// <summary>
        /// Get item by hash key. Use only if table has only hash key without range key.
        /// If table has hash key and range key use <see cref="GetAsync(object, object)"/> or to get items by hash key <see cref="GetAsync(object)"/>
        /// </summary>
        /// <param name="hashKey"></param>
        /// <returns></returns>
        public async Task<T> GetItemAsync(object hashKey)
        {
            try
            {
                return await _dbContext.LoadAsync<T>(hashKey, _config.ConvertToLoadConfig());
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't get item with hashKey: {LogSanitizer.SanitizeNewLines(hashKey)} from table: {_config?.OverrideTableName}");
                _logger?.LogError(e.StackTrace);
                return default;
            }
        }

        /// <summary>
        /// Save item into table
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        public async Task SaveAsync(T item)
        {
            try
            {
                await _dbContext.SaveAsync(item, _config.ConvertToSaveConfig());
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't save item into table: {_config?.OverrideTableName}");
                throw;
            }
        }

        /// <summary>
        /// Save items into table
        /// </summary>
        /// <param name="items"></param>
        /// <returns></returns>
        public async Task SaveAsync(IEnumerable<T> items)
        {
            if (items == null || !items.Any())
            {
                return;
            }

            try
            {
                var batchWrite = _dbContext.CreateBatchWrite<T>(_config.ConvertToBatchWriteConfig());

                batchWrite.AddPutItems(items);

                await batchWrite.ExecuteAsync();
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't save items into table: {_config?.OverrideTableName}");
                throw;
            }
        }

        /// <summary>
        /// Delete item from table
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        public async Task DeleteAsync(T item)
        {
            try
            {
                await _dbContext.DeleteAsync(item, _config.ConvertToDeleteConfig());
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't delete item from table: {_config?.OverrideTableName}");
                throw;
            }

        }

        /// <summary>
        ///  Delete items from table
        /// </summary>
        /// <param name="hashKeys"></param>
        /// <returns></returns>
        public async Task DeleteAsync(IEnumerable<object> hashKeys)
        {
            if (hashKeys.IsNullOrEmpty())
            {
                return;
            }

            try
            {
                var batchWrite = _dbContext.CreateBatchWrite<T>(_config.ConvertToBatchWriteConfig());

                foreach (var hashKey in hashKeys)
                {
                    batchWrite.AddDeleteKey(hashKey);
                }

                await batchWrite.ExecuteAsync();
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't delete items from table: {_config?.OverrideTableName}");
                throw;
            }
        }

        /// <summary>
        /// Delete all items from table
        /// </summary>
        /// <returns></returns>
        public async Task DeleteAllAsync()
        {
            try
            {
                var batchWrite = _dbContext.CreateBatchWrite<T>(_config.ConvertToBatchWriteConfig());

                //TODO Try to retrieve only primary keys, not entire model
                batchWrite.AddDeleteItems(await GetAllAsync());

                await batchWrite.ExecuteAsync();
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't delete all items from table: {_config?.OverrideTableName}");
                throw;
            }
        }

        /// <summary>
        /// Get all items from table
        /// </summary>
        /// <returns></returns>
        public async Task<IEnumerable<T>> GetAllAsync()
        {
            try
            {
                var results = new List<T>();

                var asyncSearch = _dbContext.FromScanAsync<T>(new ScanOperationConfig() { ConsistentRead = true }, _config.ConvertToFromScanConfig());

                while (!asyncSearch.IsDone)
                {
                    var nextSetAsync = await asyncSearch.GetNextSetAsync();
                    results.AddRange(nextSetAsync);
                }

                return results;
            }
            catch (Exception e)
            {
                _logger?.LogError(e, $"Can't get all items from table: {_config?.OverrideTableName}");
                throw;
            }
        }
    }
}