using System;
using Amazon.DynamoDBv2.DataModel;
using easyJet.Foundation.DynamoDb.Helpers;

namespace easyJet.Foundation.DynamoDb.Models
{
    public class EmailMessageAwsDbModel
    {
        [DynamoDBProperty("contactId")]
        [DynamoDBHashKey]
        public string ContactId { get; set; }

        [DynamoDBProperty("emailId")]
        [DynamoDBRangeKey]
        public string EmailId { get; set; }

        [DynamoDBProperty("body")]
        public string Body { get; set; }

        [DynamoDBProperty("sentDate")]
        public DateTime SentDate { get; set; }

        [DynamoDBProperty("subject")]
        public string Subject { get; set; }
    }
}