using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings
{
    public class BookingSession
    {
        /// <summary>
        /// Number of the booking
        /// </summary>
        [DynamoDBHashKey]
        public string BookingRef { get; set; }

        /// <summary>
        /// SessionId to be used by atcom for aforementioned booking
        /// </summary>
        [DynamoDBProperty]
        public string SessionId { get; set; }

        /// <summary>
        /// Time-to-Live property
        /// </summary>
        [DynamoDBProperty(StoreAsEpochLong = true)]
        public DateTime? TTL { get; set; }
    }
}
