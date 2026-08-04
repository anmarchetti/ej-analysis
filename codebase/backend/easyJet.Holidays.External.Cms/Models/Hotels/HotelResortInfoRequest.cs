using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class HotelResortInfoRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "code")]
        public string Code { get; set; }
    }
}
