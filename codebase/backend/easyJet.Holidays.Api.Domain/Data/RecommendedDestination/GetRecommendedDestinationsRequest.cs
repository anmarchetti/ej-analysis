using easyJet.Holidays.Api.Domain.Data.Common;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{

    /// <summary>
    /// Wide search for recommended destination request
    /// </summary>
    public class RecommendedDestinationsRequest
    {
        /// <summary>
        /// Departure airport codes (Ex. 'LTN', 'EDI')
        /// </summary>
        [DataMember(Name = "departure")]
        public string Departure { get; set; }

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

        /// <summary>
        /// Selected months.
        /// </summary>
        [DataMember(Name = "dates")]
        public IEnumerable<DateTimeRange> Dates { get; set; }

        /// <summary>
        /// Stay duration.
        /// </summary>
        [DataMember(Name = "duration")]
        public int Duration { get; set; }
    }
}
