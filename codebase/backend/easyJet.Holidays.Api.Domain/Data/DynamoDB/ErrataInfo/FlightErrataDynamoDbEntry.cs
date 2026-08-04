using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.ErrataInfo
{
    public class FlightErrataDynamoDbEntry
    {
        [DynamoDBHashKey("Code")]
        public string Code { get; set; }

        public string ErratasInfo { get; set; }
    }
}