using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.SearchPodValidation
{
    /// <summary>
    /// Represents missed destination search
    /// </summary>
    public class MissedDestinationSearch
    {
        /// <summary>
        /// Id
        /// </summary>
        [DynamoDBHashKey]
        public string Id { get; set; }

        /// <summary>
        /// Query
        /// </summary>
        [DynamoDBProperty]
        public string Query { get; set; }

        /// <summary>
        /// From
        /// </summary>
        [DynamoDBProperty]
        public string From { get; set; }

        /// <summary>
        /// Search date
        /// </summary>
        [DynamoDBProperty]
        public DateTime SearchDate { get; set; }

        /// <summary>
        /// Number of flexible days
        /// </summary>
        [DynamoDBProperty]
        public int FlexibleDays { get; set; }

        /// <summary>
        /// Start date
        /// </summary>
        [DynamoDBProperty]
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// End date
        /// </summary>
        [DynamoDBProperty]
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Market
        /// </summary>
        [DynamoDBProperty]
        public string Market { get; set; }

        /// <summary>
        /// Language
        /// </summary>
        [DynamoDBProperty]
        public string Language { get; set; }
    }
}
