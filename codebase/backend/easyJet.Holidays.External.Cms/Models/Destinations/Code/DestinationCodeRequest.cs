using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Code
{
    public class DestinationCodeRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        /// <summary>
        /// Name of destination by which to look for destination code.
        /// </summary>
        [DataMember(Name = "name")]
        public string DestinationName { get; set; }
    }
}
