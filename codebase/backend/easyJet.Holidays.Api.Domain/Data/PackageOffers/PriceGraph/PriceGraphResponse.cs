using easyJet.Holidays.Api.Domain.Data.Settings;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.PriceGraph
{
    /// <summary>
    /// Price graph for accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class PriceGraphResponse
    {
        /// <summary>
        /// Collection of offers
        /// </summary>
        [DataMember(Name = "offers")]
        public List<AlternativeOffer> Offers { get; set; }
    }

    /// <summary>
    /// Price graph for accommodation
    /// </summary>
    [Serializable]
    [DataContract]
    public class AlternativeOffer : IPriceModel
    {
        /// <summary>
        /// Detailed Board Type description
        /// </summary>
        [DataMember(Name = "boardType")]
        public BoardType BoardType { get; set; }

        /// <summary>
        /// Offer start Datetime
        /// </summary>
        [DataMember(Name = "date")]
        public DateTime? Date { get; set; }

        /// <summary>
        /// Total price
        /// </summary>
        [DataMember(Name = "price")]
        public decimal Price { get; set; }

        /// <summary>
        /// Price per person
        /// </summary>
        [DataMember(Name = "pricePP")]
        public decimal PricePP { get; set; }

        /// <summary>
        /// Tourist tax 
        /// </summary>
        [DataMember(Name = "touristTax")]
        public decimal TouristTax { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        [DataMember(Name = "currency")]
        public Currency Currency { get; set; }

        /// <summary>
        /// Alternative board basis
        /// </summary>
        [DataMember(Name = "board")]
        public string Board { get; set; }

        /// <summary>
        /// Colletion of room to accommodate multi room search
        /// </summary>
        [DataMember(Name = "rooms")]
        public List<AlternateRoom> Rooms { get; init; }

        /// <summary>
        /// Outbound route id.
        /// </summary>
        [DataMember(Name = "outboundRouteId")]
        public string OutboundRouteId { get; set; }

        /// <summary>
        /// inbound route id.
        /// </summary>
        [DataMember(Name = "inboundRouteId")]
        public string InboundRouteId { get; set; }

        /// <summary>
        /// Accommodation id.
        /// </summary>
        [DataMember(Name = "accommodationId")]
        public string AccommodationId { get; set; }
    }

    /// <summary>
    /// Price graph alternate room.
    /// </summary>
    [Serializable]
    [DataContract]
    public class AlternateRoom
    {
        /// <summary>
        /// RoomCode
        /// </summary>
        [DataMember(Name = "roomCode")]
        public string RoomCode { get; set; }

        /// <summary>
        /// Are kids free
        /// </summary>
        [DataMember(Name = "isFreeForKids")]
        public bool IsFreeForKids { get; init; }

        /// <summary>
        /// Detailed Room Type description
        /// </summary>
        [DataMember(Name = "roomType")]
        public RoomType RoomType { get; set; }
    }
}
