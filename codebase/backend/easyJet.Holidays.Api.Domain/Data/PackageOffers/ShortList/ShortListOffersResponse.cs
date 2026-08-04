using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer
{
    /// <summary>
    /// Shortlist offers, saved by logged-in user
    /// </summary>
    [Serializable]
    [DataContract]
    public class ShortListOffersResponse
    {
        /// <summary>
        /// Search Status
        /// </summary>
        [DataMember(Name = "status")]
        public Status Status { get; set; }

        /// <summary>
        /// Offers, repeat the packages scheme, but is being
        /// searched depending on data, saved into DynamoDB
        /// </summary>
        [DataMember(Name = "offers")]
        public List<Offer> Offers { get; set; }
    }
}
