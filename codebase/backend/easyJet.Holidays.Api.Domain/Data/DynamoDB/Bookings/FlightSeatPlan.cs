using Amazon.DynamoDBv2.DataModel;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.Bookings
{
    public class FlightSeatPlan
    {
        /// <summary>
        /// Flight identifier
        /// </summary>
        [DynamoDBHashKey]
        public string FlightId { get; set; }

        /// <summary>
        /// Flight seat plan data
        /// </summary>
        [DynamoDBProperty]
        public List<Seat> Seats { get; set; }

        /// <summary>
        /// Time-to-Live property
        /// </summary>
        [DynamoDBProperty(StoreAsEpochLong = true)]
        public DateTime? TTL { get; set; }
    }
}
