using Amazon.DynamoDBv2.Model;
using Amazon.Util;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace easyJet.Holidays.External.AWS.Services.Amend
{
    /// <summary>
    /// Provides a caching mechanism for storing and retrieving data in AWS DynamoDB.
    /// </summary>
    /// <remarks>
    /// This service utilizes an AWS DynamoDB table to store serialized items along with expiration times.
    /// Items are identified by a combination of partition key and sort key.
    /// </remarks>
    public class AmendCacheService : IAmendCacheService
    {
        private readonly AwsSettings _awsSettings;
        private readonly AwsClient _awsClient;

        private const string PartitionKeyFieldName = "HashKey";
        private const string ExpirationTimeFieldName = "ExpirationTime";
        private const string ItemFieldName = "Item";

        /// <summary>
        /// Initializes a new instance of the <see cref="AmendCacheService"/> class.
        /// </summary>
        /// <param name="awsSettings">
        /// The AWS settings used to configure DynamoDB. An exception is thrown if this value is <c>null</c>.
        /// </param>
        /// <param name="awsClient">
        /// A client used to connect to AWS services.
        /// </param>
        /// <exception cref="ArgumentNullException">
        /// Thrown if <paramref name="awsSettings"/> is <c>null</c>.
        /// </exception>
        public AmendCacheService(
            IOptions<AwsSettings> awsSettings,
            AwsClient awsClient)
        {
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _awsClient = awsClient;
        }

        /// <summary>
        /// Stores an item in the DynamoDB table, setting an expiration time based 
        /// on the cache configuration in <see cref="AwsSettings"/>.
        /// </summary>
        /// <typeparam name="T">
        /// The type of the item to store. Must be a reference type.
        /// </typeparam>
        /// <param name="partitionKey">
        /// The partition key in DynamoDB for identifying this item.
        /// </param>
        /// <param name="item">
        /// The object to be serialized and stored in DynamoDB.
        /// </param>
        /// <returns>
        /// A <see cref="Task"/> representing the asynchronous operation. 
        /// Completes when the item has been successfully stored in the table.
        /// </returns>
        public async Task SetItemAsync<T>(string partitionKey, T item) where T : class
        {
            var cacheTime = _awsSettings.TTL.AmendCache;
            var serializedItem = JsonSerializer.Serialize(item);
            var putItemRequest = new PutItemRequest
            {
                TableName = _awsSettings.Storage.Tables.AmendCache,
                Item = new Dictionary<string, AttributeValue>
                {
                    {
                        PartitionKeyFieldName,
                        new AttributeValue { S = partitionKey }
                    },
                    {
                        ItemFieldName,
                        new AttributeValue { S = serializedItem }
                    },
                    {
                        ExpirationTimeFieldName,
                        new AttributeValue
                        {
                            N = AWSSDKUtils.ConvertToUnixEpochSecondsString(DateTime.UtcNow.AddSeconds(cacheTime))
                        }
                    }
                }
            };

            using var client = _awsClient.GetClient();
            await client.PutItemAsync(putItemRequest);
        }

        /// <summary>
        /// Retrieves a previously stored item from the DynamoDB table.
        /// </summary>
        /// <typeparam name="T">
        /// The type of the item to retrieve. Must be a reference type.
        /// </typeparam>
        /// <param name="partitionKey">
        /// The partition key used to identify the item.
        /// </param>
        /// <returns>
        /// A <see cref="Task{T}"/> whose result is the retrieved item as an instance of 
        /// <typeparamref name="T"/>, or <c>null</c> if the item does not exist 
        /// or has expired.
        /// </returns>
        public async Task<T> GetItemAsync<T>(string partitionKey) where T : class
        {
            var getItemRequest = new GetItemRequest
            {
                TableName = _awsSettings.Storage.Tables.AmendCache,
                Key = new Dictionary<string, AttributeValue>
                {
                    { PartitionKeyFieldName, new AttributeValue { S = partitionKey } }
                }
            };

            using var client = _awsClient.GetDynamoDbClientWithLogging();
            var getItemResponse = await client.GetItemAsync(getItemRequest);
            if (IsItemExist(getItemResponse))
            {
                var serializedItem = getItemResponse.Item[ItemFieldName].S;
                var item = JsonSerializer.Deserialize<T>(serializedItem);
                return item;
            }

            return null;
        }

        /// <summary>
        /// Determines whether the retrieved item is valid and not expired.
        /// </summary>
        /// <param name="getItemResponse">
        /// The DynamoDB response containing the item data, if available.
        /// </param>
        /// <returns>
        /// <c>true</c> if the item exists and is still valid (not expired); otherwise <c>false</c>.
        /// </returns>
        private static bool IsItemExist(GetItemResponse getItemResponse)
        {
            var result = getItemResponse.Item is { Count: > 0 } &&
                         !IsCacheValueExpired(getItemResponse);

            return result;
        }

        /// <summary>
        /// Determines whether the stored TTL (time-to-live) has passed for the specified item, 
        /// indicating that it has expired.
        /// </summary>
        /// <param name="getItemResponse">
        /// The DynamoDB get-item response containing the item from which to retrieve the TTL.
        /// </param>
        /// <returns>
        /// <c>true</c> if the item’s TTL has elapsed; otherwise <c>false</c>.
        /// </returns>
        private static bool IsCacheValueExpired(GetItemResponse getItemResponse)
        {
            return
                getItemResponse.Item.TryGetValue(ExpirationTimeFieldName, out var timeSpanValue)
                && long.TryParse(timeSpanValue.N, out var expireTime)
                && expireTime < DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        }
    }
}