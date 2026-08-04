using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers
{
    /// <summary>
    /// Room variants for accommodation response model
    /// </summary>
    [Serializable]
    [DataContract]
    public class AccommodationOffersResponse
    {
        /// <summary>
        /// Offer hotel details
        /// </summary>
        [DataMember(Name = "hotel")]
        public OfferHotel Hotel { get; set; }

        /// <summary>
        /// Alternative offers for hotel
        /// </summary>
        [DataMember(Name = "offers")]
        public List<Offer> Offers { get; set; }
    }
}
