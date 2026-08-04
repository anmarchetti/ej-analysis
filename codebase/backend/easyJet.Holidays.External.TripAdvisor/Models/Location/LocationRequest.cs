using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Dflo.Models.Search
{
    public class LocationRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "fulltext")]
        public bool Fulltext { get; set; }

        [DataMember(Name = "lang")]
        public string Lang { get; set; }

        [DataMember(Name = "key")]
        public string Key { get; set; }
    }
}
