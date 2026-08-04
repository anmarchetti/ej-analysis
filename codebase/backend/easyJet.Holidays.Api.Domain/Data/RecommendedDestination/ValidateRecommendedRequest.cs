using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.RecommendedDestination
{
    /// <summary>
    /// Validate recommended request model.
    /// </summary>
    public class ValidateRecommendedRequest
    {
        /// <summary>
        /// Departure airport codes (Ex. 'LTN', 'EDI')
        /// </summary>
        [DataMember(Name = "departure")]
        public string Departure { get; set; }

        /// <summary>
        /// Weather code, ex. Hot/Cold
        /// </summary>
        [DataMember(Name = "weather")]
        public string Weather { get; set; }
    }
}
