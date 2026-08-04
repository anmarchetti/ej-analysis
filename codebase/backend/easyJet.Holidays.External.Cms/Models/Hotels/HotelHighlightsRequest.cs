using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    /// <inheritdoc />
    public class HotelHighlightsRequest : JsonApiRequest<object>
    {
        /// <inheritdoc />
        public override HttpMethod Method => HttpMethod.Get;

        /// <summary>
        /// Hotel Code.
        /// </summary>
        [DataMember(Name = "code")]
        public string Code { get; set; }
    }
}
