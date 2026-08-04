using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Countries
{
    public class CountriesRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "showOnSearchPod")]
        public bool ShowOnSearchPod { get; set; }

        [DataMember(Name = "shouldGetItemsForDropdownOnly")]
        public bool ShouldGetItemsForDropdownOnly { get; set; }
    }
}
