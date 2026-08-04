using Amazon.DynamoDBv2.DataModel;
using easyJet.Holidays.Api.Domain.Utils.Aws;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Marketing
{
    public class Unsubscribe
    {
        private string _email;

        [DynamoDBHashKey]
        public string Email
        {
            get => _email.ToLowerInvariant();
            set => _email = value.ToLowerInvariant(); //store in dynamo db emails in lower case only
        }

        [DynamoDBProperty]
        public DateTime? OptOutDate { get; set; }

        [DynamoDBProperty]
        public DateTime? SentForScreeningDate { get; set; }

        [DynamoDBProperty(typeof(EnumConverter<Status>))]
        public Status Status { get; set; }

        /// <summary>
        /// Source of the Unsubscribe
        /// </summary>
        [DynamoDBProperty(typeof(EnumConverter<Source>))]
        public Source Source { get; set; }

        public static Source ParseSource(string source)
        {
            if (string.IsNullOrEmpty(source))
            {
                return Source.CSAT;
            }
            switch (source?.ToLower())
            {
                case "feefo":
                    return Source.FEEFO;
                case "csat":
                default:
                    return Source.CSAT;
            }
        }
    }

    /// <summary>
    /// System of origin
    /// </summary>
    public enum Source
    {
        /// <summary>
        /// coming from CSAT
        /// </summary>
        CSAT,
        /// <summary>
        /// coming from FEEFO
        /// </summary>
        FEEFO,
    }

    public enum Status
    {
        /// <summary>
        /// Unsubscribe is pending screening
        /// </summary>
        PENDING,

        /// <summary>
        /// Unsubscribe has been screened
        /// </summary>
        SCREENED
    }
}