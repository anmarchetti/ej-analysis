using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Foundation.DynamoDb.Models
{
    public class LiveChatMessageAwsDbModel
    {
        [DynamoDBProperty("trackerId")]
        [DynamoDBHashKey]
        public string TrackerId { get; set; }

        [DynamoDBProperty("sessionId")]
        public string SessionId { get; set; }

        [DynamoDBProperty("conversationSource")]
        public int ConversationSource { get; set; }

        [DynamoDBProperty("intent")]
        public string Intent { get; set; }

        [DynamoDBProperty("query")]
        public string Query { get; set; }

        [DynamoDBProperty("referrerIntent")]
        public string ReferrerIntent { get; set; }

        /// <summary>
        /// Gets or sets timestamp in milliseconds.
        /// </summary>
        [DynamoDBProperty("timestamp")]
        [DynamoDBRangeKey]
        public ulong Timestamp { get; set; }
    }
}