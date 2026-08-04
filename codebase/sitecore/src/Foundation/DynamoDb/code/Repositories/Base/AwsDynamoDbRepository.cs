using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.DynamoDb.Repositories.Base
{
    public class AwsDynamoDbRepository<T> : IAwsDynamoDbRepository<T>
        where T : class
    {
        private readonly IDynamoDBContext dbContext;
        private readonly string tableName;

        public AwsDynamoDbRepository(IAwsDynamoDbContextFactory<T> factory)
        {
            (dbContext, tableName) = factory.Create();
        }

        public async Task Save(T item)
        {
            try
            {
                await dbContext.SaveAsync(item, new SaveConfig { OverrideTableName = tableName }).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                Log.Error($"Can't save items into table: {tableName}. Exception: {ex}", this);
                throw;
            }
        }

        public async Task SaveBatch(List<T> items, int batchPortion = Constants.AwsDynamoDbSettings.Batching.DefaultBatchSize)
        {
            if (items == null || !items.Any())
            {
                return;
            }

            try
            {
                var batchWrite = dbContext.CreateBatchWrite<T>(new BatchWriteConfig { OverrideTableName = tableName });

                var batchItemsToProcess = items.Count;
                var emailsProcessed = 0;

                while (batchItemsToProcess > 0)
                {
                    var itemsToTake = batchItemsToProcess < batchPortion ? batchItemsToProcess : batchPortion;

                    var itemsBatch = items.GetRange(emailsProcessed, itemsToTake);
                    batchWrite.AddPutItems(itemsBatch);
                    await batchWrite.ExecuteAsync().ConfigureAwait(false);

                    batchItemsToProcess -= itemsToTake;
                    emailsProcessed += itemsToTake;
                }
            }
            catch (ProvisionedThroughputExceededException)
            {
                Log.Error($"Provision configuration error for table: {tableName}.", this);
                throw;
            }
            catch (Exception ex)
            {
                Log.Error($"Can't save items into table: {tableName}. Exception: {ex}", this);
                throw;
            }
        }

        public async Task SaveBatchAsync(List<T> items, int concurrencyTasks, int batchPortion = Constants.AwsDynamoDbSettings.Batching.DefaultBatchSize)
        {
            if (items == null || !items.Any())
            {
                return;
            }

            try
            {
                var batchesCollection = items.SplitList(batchPortion);

                using (var semaphore = new SemaphoreSlim(concurrencyTasks))
                {
                    var submitTasks = batchesCollection.Select(async batch =>
                    {
                        await semaphore.WaitAsync();
                        try
                        {
                            var batchWrite = dbContext.CreateBatchWrite<T>(new BatchWriteConfig { OverrideTableName = tableName });
                            batchWrite.AddPutItems(batch);
                            await batchWrite.ExecuteAsync().ConfigureAwait(false);
                            Log.Info($"[Dflo] submitted batch with {batch.Count} emails.", this);
                        }
                        finally
                        {
                            semaphore.Release();
                        }
                    });
                    await Task.WhenAll(submitTasks);
                }
            }
            catch (ProvisionedThroughputExceededException)
            {
                Log.Error($"Provision configuration error for table: {tableName}.", this);
                throw;
            }
            catch (Exception ex)
            {
                Log.Error($"Can't save items into table: {tableName}. Exception: {ex}", this);
                throw;
            }
        }

        public async Task<IEnumerable<T>> Get(string key)
        {
            try
            {
                var results = await dbContext.QueryAsync<T>(key, new QueryConfig { OverrideTableName = tableName }).GetRemainingAsync().ConfigureAwait(false);
                return results;
            }
            catch (Exception ex)
            {
                Log.Error(
                    $"Can't get items with hashKey: {key} from table: {tableName}. Exception: {ex}",
                    this);
                return new List<T>();
            }
        }

        public async Task<IEnumerable<T>> GetAll(ICollection<ScanCondition> conditions = null)
        {
            try
            {
                var results = await dbContext.ScanAsync<T>(conditions ?? new List<ScanCondition>(), new ScanConfig { OverrideTableName = tableName }).GetRemainingAsync().ConfigureAwait(false);
                return results;
            }
            catch (Exception ex)
            {
                Log.Error(
                    $"Can't get items from table: {tableName}. Exception: {ex}",
                    this);
                return new List<T>();
            }
        }

        public IAsyncSearch<T> GetSearchBatchWorker(ICollection<ScanCondition> conditions = null) => dbContext.ScanAsync<T>(conditions ?? new List<ScanCondition>(), new ScanConfig { OverrideTableName = tableName });

        public IAsyncSearch<T> GetSearchBatchWorkerFromScanConfig(ScanOperationConfig scanConfig) => dbContext.FromScanAsync<T>(scanConfig, new FromScanConfig { OverrideTableName = tableName });
    }
}
