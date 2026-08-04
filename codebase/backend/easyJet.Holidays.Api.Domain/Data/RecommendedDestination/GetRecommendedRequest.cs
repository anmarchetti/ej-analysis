using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Get recommended destination request
    /// </summary>
    public class GetRecommendedRequest
    {
        /// <summary>
        /// Departure airport codes (Ex. 'LTN', 'EDI')
        /// </summary>
        [DataMember(Name = "departure")]
        public string Departure { get; set; }

        /// <summary>
        /// Inbound date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [DataMember(Name = "from")]
        public DateTime? From { get; set; }

        /// <summary>
        /// Outbound date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [DataMember(Name = "to")]
        public DateTime? To { get; set; }


        /// <summary>
        /// Number of flexible days.
        /// </summary>
        [DataMember(Name = "flexibleDays")]
        public int FlexibleDays { get; set; }

        /// <summary>
        /// Weather code. (ex. Warm and Sunny or Cold)
        /// </summary>
        [DataMember(Name = "weather")]
        public string Weather { get; set; }

        /// <summary>
        /// Tags that used to find destination by tag. (ex. Holday Vibe, Travel Group)
        /// </summary>
        [DataMember(Name = "tags")]
        public string Tags { get; set; }
    }
}
