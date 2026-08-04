using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Musement.Models
{
    public class SearchCitiesRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "coordinates")]
        public string Coordinates { get; set; }

        [DataMember(Name = "distance")]
        public string Distance { get; set; }
    }
}
