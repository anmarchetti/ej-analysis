using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.External.Domain.Models
{
    /// <summary>
    /// Model refer to dynamo db data structure 
    /// </summary>
    public class Token
    {
        /// <summary>
        /// Hash key (must be unique)
        /// </summary>
        [DynamoDBHashKey]
        public string Key { get; set; }

        /// <summary>
        /// Access token
        /// </summary>
        [DynamoDBProperty]
        public string AccessToken { get; set; }

        /// <summary>
        /// Expiration time
        /// </summary>
        [DynamoDBProperty]
        public DateTime ExpirationTime { get; set; }
    }
}
