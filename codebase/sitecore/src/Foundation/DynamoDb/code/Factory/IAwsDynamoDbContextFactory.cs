using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Foundation.DynamoDb.Factory
{
    public interface IAwsDynamoDbContextFactory<T>
        where T : class
    {
        (IDynamoDBContext context, string tableName) Create();
    }
}
