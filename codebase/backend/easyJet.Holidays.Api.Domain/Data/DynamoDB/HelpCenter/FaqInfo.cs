using Amazon.DynamoDBv2.DataModel;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.HelpCenter
{
    [DataContract]
    [Serializable]
    public class FaqInfo
    {
        /// <summary>
        /// FAQ question title
        /// </summary>
        [DataMember]
        [Required]
        [DynamoDBHashKey]
        public string Question { get; set; }

        /// <summary>
        /// FAQ question id
        /// </summary>
        [DynamoDBRangeKey]
        public string QuestionId { get; set; }

        /// <summary>
        /// FAQ question header
        /// </summary>
        [DataMember]
        [DynamoDBProperty]
        public string QuestionHeader { get; set; }

        /// <summary>
        /// Mark, if FAQ was useful
        /// </summary>
        [DataMember]
        [Required]
        [DynamoDBProperty]
        public bool WasUseful { get; set; }

        /// <summary>
        /// FAQ question text
        /// </summary>
        [DataMember]
        [DynamoDBProperty]
        public string Text { get; set; }

        /// <summary>
        /// Date, the question was posted on
        /// </summary>
        [DynamoDBProperty]
        public DateTime Date { get; set; }

        /// <summary>
        /// FAQ question language
        /// </summary>
        [DataMember]
        [DynamoDBProperty]
        public string LanguageCode { get; set; }

        /// <summary>
        /// Market code
        /// </summary>
        [DataMember]
        [DynamoDBProperty]
        public string MarketCode { get; set; }

        /// <summary>
        /// Local time, the question was posted on
        /// </summary>
        [DataMember]
        [DynamoDBProperty]
        public DateTime LocalTime { get; set; }
    }
}