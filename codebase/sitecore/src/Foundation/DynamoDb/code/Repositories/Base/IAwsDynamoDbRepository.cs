using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;

namespace easyJet.Foundation.DynamoDb.Repositories.Base
{
    public interface IAwsDynamoDbRepository<T>
        where T : class
    {
        Task Save(T item);

        Task SaveBatch(List<T> items, int batchPortion = Constants.AwsDynamoDbSettings.Batching.DefaultBatchSize);

        Task SaveBatchAsync(List<T> items, int concurrencyTasks, int batchPortion = Constants.AwsDynamoDbSettings.Batching.DefaultBatchSize);

        Task<IEnumerable<T>> Get(string id);

        Task<IEnumerable<T>> GetAll(ICollection<ScanCondition> conditions = null);

        IAsyncSearch<T> GetSearchBatchWorker(ICollection<ScanCondition> conditions = null);

        IAsyncSearch<T> GetSearchBatchWorkerFromScanConfig(ScanOperationConfig scanConfig);
    }
}
