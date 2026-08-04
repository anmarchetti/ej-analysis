using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights
{
    /// <summary>
    /// Alternative flights for accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class AlternativeFlightsResponse
    {
        /// <summary>
        /// Collection of offers
        /// </summary>
        [DataMember(Name = "offers")]
        public List<Offer> Offers { get; set; }
    }
}
