using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Musement.Models
{
    public class SearchActivitiesRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "country_in")]
        public string CountryIn { get; set; }

        [DataMember(Name = "city_in")]
        public string CityIn { get; set; }

        [DataMember(Name = "coordinates")]
        public string Coordinates { get; set; }

        [DataMember(Name = "distance")]
        public string Distance { get; set; }

        [DataMember(Name = "offset")]
        public uint Skip { get; set; }

        [DataMember(Name = "limit")]
        public uint Take { get; set; } = 10;

        [DataMember(Name = "available_from")]
        public string AvailableFrom { get; set; }

        [DataMember(Name = "available_to")]
        public string AvailableTo { get; set; }

        [DataMember(Name = "sort_by")]
        public string SortBy { get; set; } = "-relevance-city";

        [DataMember(Name = "currency")]
        public string Currency { get; set; }
    }
}
