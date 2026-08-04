using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class HotelsCodesSearchRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

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
