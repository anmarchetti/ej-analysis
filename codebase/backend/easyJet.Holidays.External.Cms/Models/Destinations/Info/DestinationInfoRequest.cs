using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Cms.Models.Destinations.Info
{
    /// <summary>
    /// Destination info request.
    /// </summary>
    public class DestinationInfoRequest : JsonApiRequest<object>
    {
        /// <inheritdoc/>
        public override HttpMethod Method => HttpMethod.Get;

        /// <summary>
        /// Code of destination.
        /// </summary>
        [DataMember(Name = "code")]
        public string DestinationCode { get; set; }
    }
}
