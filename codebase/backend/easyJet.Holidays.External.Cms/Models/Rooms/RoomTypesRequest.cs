using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Rooms
{
    public class RoomTypesRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "page")]
        public int Page { get; set; }

        [DataMember(Name = "take")]
        public int Take { get; set; }
    }
}
