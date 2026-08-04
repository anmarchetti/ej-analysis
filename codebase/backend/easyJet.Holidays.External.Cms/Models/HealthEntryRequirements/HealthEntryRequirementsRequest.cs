using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.HealthEntryRequirements
{
    public class HealthEntryRequirementsRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "airportCode")]
        public string AirportCode { get; set; }
    }
}
