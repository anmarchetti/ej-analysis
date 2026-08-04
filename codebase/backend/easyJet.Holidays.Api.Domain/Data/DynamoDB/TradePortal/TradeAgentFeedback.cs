using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain.Utils.Aws;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.TradePortal
{
    public class TradeAgentFeedback
    {
        [DynamoDBHashKey]
        public string Id { get; set; }

        [DynamoDBProperty]
        public string Created { get; set; }

        /// <summary>
        /// Name of the feedback provider
        /// </summary>
        [DynamoDBProperty]
        public string Name { get; set; }

        /// <summary>
        /// Name of the travel agent / business
        /// </summary>
        [DynamoDBProperty]
        public string TradeAgentName { get; set; }

        /// <summary>
        /// the ABTA number
        /// </summary>
        [DynamoDBProperty]
        public string ABTANumber { get; set; }

        /// <summary>
        /// contact email
        /// </summary>
        [DynamoDBProperty]
        public string Email { get; set; }

        /// <summary>
        /// Whether the feedback is related to the website itself
        /// </summary>
        [DynamoDBProperty(typeof(BooleanConverter))]
        public bool IsWebsiteRelated { get; set; }
        /// <summary>
        /// Whether the feedback is trade specific
        /// </summary>
        [DynamoDBProperty(typeof(BooleanConverter))]
        //[DynamoDBProperty]
        public bool IsTradeFeedback { get; set; }
        /// <summary>
        /// for all kinds of feedback not related to either <see cref="IsWebsiteRelated"/> or <see cref="IsTradeFeedback"/>
        /// </summary>
        [DynamoDBProperty(typeof(BooleanConverter))]
        public bool IsOtherFeedback { get; set; }

        /// <summary>
        /// the actual feedback
        /// </summary>
        [DynamoDBProperty]
        public string FeedbackText { get; set; }

        /// <summary>
        /// List of attached files paths
        /// </summary>
        [DynamoDBProperty]
        public IList<string> Attachments { get; set; }
    }
}