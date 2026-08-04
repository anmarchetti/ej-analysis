using System.Diagnostics.CodeAnalysis;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.DynamoDb.Helpers;

namespace easyJet.Foundation.DynamoDb.Factory
{
    [Service(typeof(IAwsDynamoDbContextFactory<>), Lifetime = Lifetime.Singleton)]
    [ExcludeFromCodeCoverage]
    public class AwsDynamoDbContextFactory<T> : IAwsDynamoDbContextFactory<T>
        where T : class
    {
        private readonly IAmazonDynamoDB client;

        public AwsDynamoDbContextFactory(IAmazonDynamoDB client)
        {
            this.client = client;
        }

        public (IDynamoDBContext context, string tableName) Create()
        {
            var tableName = AwsDynamoDbTableHelper.GetTableForModel<T>();
            var context = new DynamoDBContextBuilder()
                .WithDynamoDBClient(() => client)
                .ConfigureContext(c => c.ConsistentRead = true)
                .Build();

            return (context, tableName);
        }
    }
}
