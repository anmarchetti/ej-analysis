using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    public class HotelsCodesRequest
    {
        /// <summary>
        /// Number of ids to take.
        /// </summary>
        [DataMember(Name = "take")]
        public int Take { get; set; }

        /// <summary>
        /// Start position to take ids from.
        /// </summary>
        [DataMember(Name = "page")]
        public int Page { get; set; }

        /// <summary>
        /// Date to get ids from updated hotels.
        /// </summary>
        [DataMember(Name = "lastupdated")]
        public DateTime? LastUpdated { get; set; }
    }
}
