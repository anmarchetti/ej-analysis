using easyJet.Holidays.Api.Domain.Data.Destinations;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Destinations
{
    public class DestinationsRequest : JsonApiRequest<object>
    {
        public override HttpMethod Method => HttpMethod.Get;

        [DataMember(Name = "searchQuery")]
        public string SearchQuery { get; set; }

        /// <summary>
        /// Bit flag for destination levels
        /// </summary>
        [DataMember(Name = "destinationFilter")]
        public DestinationFilter DestinationFilter { get; set; }
    }
}
