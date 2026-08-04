using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.Services.Counter
{
    /// <summary>
    /// AWs service functions
    /// </summary>
    public class AwsAtomicCounterService : IAtomicCounterService
    {
        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="awsSettings"></param>
        /// <param name="awsClient"></param>
        public AwsAtomicCounterService(IOptions<AwsSettings> awsSettings, AwsClient awsClient)
        {
            _awsSettings = awsSettings.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
        }

        /// <summary>
        /// Get next id using atomic counter
        /// </summary>
        /// <param name="counterName">Counter unique name</param>
        /// <returns></returns>
        public async Task<decimal> GetNextId(string counterName)
        {
            var request = new UpdateItemRequest
            {
                TableName = _awsSettings.Storage.Tables.Counters,
                Key = new Dictionary<string, AttributeValue>() { { "Name", new AttributeValue { S = counterName } } },
                ExpressionAttributeNames = new Dictionary<string, string>()
                {
                    {"#v", "Value"}
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>()
                {
                    {":incr",new AttributeValue {N = "1"}},
                    {":zero",new AttributeValue {N = "0"}}
                },
                UpdateExpression = "SET #v = if_not_exists(#v, :zero) + :incr",
                ReturnValues = ReturnValue.ALL_NEW
            };

            using (var client = _awsClient.GetClient())
            {
                var result = await client.UpdateItemAsync(request);
                decimal.TryParse(result.Attributes["Value"].N, CultureInfo.InvariantCulture, out var resultId);
                return resultId;
            }
        }
    }
}
