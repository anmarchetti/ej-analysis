using System.Collections.Generic;
using System.Threading.Tasks;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;

namespace easyJet.Feature.Tracker.Services
{
    public interface IDynamoDbEmailRepository : IAwsDynamoDbRepository<EmailMessageAwsDbModel>
    {
        bool GetDoneStateFromWorker();

        Task<List<EmailMessageAwsDbModel>> GetNextSetFromWorker();
    }
}