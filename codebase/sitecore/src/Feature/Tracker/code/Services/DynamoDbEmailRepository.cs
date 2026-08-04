using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.DynamoDb.Factory;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;

namespace easyJet.Feature.Tracker.Services
{
    [Service(typeof(IDynamoDbEmailRepository), Lifetime = Lifetime.Transient)]
    public class DynamoDbEmailRepository : AwsDynamoDbRepository<EmailMessageAwsDbModel>, IDynamoDbEmailRepository
    {
        private readonly IAsyncSearch<EmailMessageAwsDbModel> batchWorker;

        public DynamoDbEmailRepository(IAwsDynamoDbContextFactory<EmailMessageAwsDbModel> factory)
            : base(factory)
        {
            batchWorker = GetBatchWorker();
        }

        public bool GetDoneStateFromWorker()
        {
            return batchWorker.IsDone;
        }

        public Task<List<EmailMessageAwsDbModel>> GetNextSetFromWorker()
        {
            return batchWorker.GetNextSetAsync();
        }

        private IAsyncSearch<EmailMessageAwsDbModel> GetBatchWorker()
        {
            var scanFilter = new ScanFilter();
            scanFilter.AddCondition(nameof(EmailMessageAwsDbModel.Body), ScanOperator.IsNull);
            var scanConfig = new ScanOperationConfig
            {
                Filter = scanFilter,
                Limit = 50
            };
            return GetSearchBatchWorkerFromScanConfig(scanConfig);
        }
    }
}