using Amazon.DynamoDBv2.DataModel;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights
{
    public class AccomFreeNights
    {
        [DynamoDBHashKey]
        public string AccommodationCode { get; set; }

        [DynamoDBProperty]
        public string AccommodationName { get; set; }

        [DynamoDBProperty]
        public List<FreeNight> AvailableFreeNights { get; set; }
    }

    /// <summary>
    /// Information about free nights to stay
    /// </summary>
    [Serializable]
    [DataContract]
    public class FreeNight
    {
        /// <summary>
        /// Room code, free nights relate to. can be set to ALL instead of a specific code
        /// </summary>
        [DynamoDBProperty]
        public string RoomCode { get; set; }

        /// <summary>
        /// Minimum count of nights to stay
        /// </summary>
        [DynamoDBProperty]
        [DataMember]
        public int MinStay { get; set; }

        /// <summary>
        /// The Date, Travel starts
        /// </summary>
        [DynamoDBProperty]
        [DataMember]
        public DateTime TravelStartDate { get; set; }

        /// <summary>
        /// The Date, Travel ends
        /// </summary>
        [DynamoDBProperty]
        [DataMember]
        public DateTime TravelEndDate { get; set; }

        /// <summary>
        /// Current Count of nights to stay
        /// </summary>
        [DynamoDBProperty]
        [DataMember]
        public int CurrentStay { get; set; }

        /// <summary>
        /// Currently available free nights to stay
        /// </summary>
        [DynamoDBProperty]
        [DataMember]
        public int CurrentFree { get; set; }
    }
}