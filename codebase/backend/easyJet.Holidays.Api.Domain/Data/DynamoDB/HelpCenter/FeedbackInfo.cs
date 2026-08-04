using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter
{
    /// <summary>
    /// Model represents user's feedback information
    /// </summary>
    public class FeedbackInfo
    {
        /// <summary>
        /// Question
        /// </summary>
        [DynamoDBHashKey]
        public string Question { get; set; }

        /// <summary>
        /// Question Id just for uniqueness saving in storage
        /// </summary>
        [DynamoDBRangeKey]
        public string QuestionId { get; set; }

        /// <summary>
        /// Icon number matching with icon descriptions:
        /// 0 - Extremely difficult
        /// 1 - Difficult
        /// 2 - Neither
        /// 3 - Easy
        /// 4 - Extremely easy
        /// </summary>
        [DynamoDBProperty]
        public int Icon { get; set; }

        /// <summary>
        /// User comment
        /// </summary>
        [DynamoDBProperty]
        public string Comment { get; set; }

        /// <summary>
        /// Date and time created
        /// </summary>
        [DynamoDBProperty]
        public DateTime Date { get; set; }

        /// <summary>
        /// Local time
        /// </summary>
        [DynamoDBProperty]
        public DateTime LocalTime { get; set; }

        /// <summary>
        /// Market code
        /// </summary>
        [DynamoDBProperty]
        public string MarketCode { get; set; }

        /// <summary>
        /// Language code
        /// </summary>
        [DynamoDBProperty]
        public string LanguageCode { get; set; }

        /// <summary>
        /// A tag for business channel (the deployment variant), the feedback form was populated on.
        /// for example, Default Website or Trade Portal
        /// </summary>
        [DynamoDBProperty]
        public string Business { get; set; }

        /// <summary>
        /// Type of the booking.
        /// Frontend will handle the types in an enum. Backend will get a string.
        /// 'flight plus hotel','standard','luxury','trade',
        /// </summary>
        [DynamoDBProperty]
        public string BookingType { get; set; }
    }
}
