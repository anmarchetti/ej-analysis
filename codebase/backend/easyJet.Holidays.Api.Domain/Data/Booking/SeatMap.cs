using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Seat selection data
    /// </summary>
    [DataContract]
    [Serializable]
    public class SeatMap
    {
        /// <summary>
        /// Seats for all passengers
        /// </summary>
        [DataMember(Name = "seats")]
        public List<Seat> Seats;

        /// <summary>
        /// Skip empty Seats list when serialize to JSON
        /// </summary>
        public bool ShouldSerializeSeats()
        {
            return Seats != null && Seats.Count > 0;
        }

        /// <summary>
        /// Flight sector ID, required for seat selection in Atcom
        /// </summary>
        [DataMember(Name = "sectorId")]
        [Required]
        public string SectorId { get; set; }

        /// <summary>
        /// Flight number
        /// </summary>
        [DataMember(Name = "flightNumber")]
        public string FlightNumber { get; set; }

        /// <summary>
        /// True when seats reservation is allowed for the flight sector with the specified <see cref="SectorId">id</see>
        /// </summary>
        [DataMember(Name = "isSeatReservationPossible")]
        public bool IsSeatReservationPossible { get; set; }
    }

    /// <summary>
    /// Seat data
    /// </summary>
    [DataContract]
    [Serializable]
    public class Seat
    {
        /// <summary>
        /// The index of the passenger to whom the seat has been assigned
        /// </summary>
        [DataMember(Name = "paxIndex")]
        [Required]
        public int PaxIndex { get; set; }

        /// <summary>
        /// Seat row number, e.g. "23"
        /// </summary>
        [IgnoreDataMember]
        public int Row => !string.IsNullOrWhiteSpace(SeatNumber) ? int.Parse(SeatNumber.Substring(0, SeatNumber.Length - 1)) : -1;

        /// <summary>
        /// Seat column number, e.g. "C"
        /// </summary>
        [IgnoreDataMember]
        public string Column => !string.IsNullOrWhiteSpace(SeatNumber) ? SeatNumber.Last().ToString() : string.Empty;

        /// <summary>
        /// Seat number, e.g. "23C"
        /// </summary>
        [DataMember(Name = "seatNumber")]
        [Required]
        public string SeatNumber { get; set; }

        /// <summary>
        /// Seat price band, e.g. "Up Front"
        /// </summary>
        [DataMember(Name = "priceBand")]
        public string PriceBand { get; set; }

        /// <summary>
        /// Seat price
        /// </summary>
        [DataMember(Name = "price")]
        public decimal Price { get; set; }

        /// <summary>
        /// Seat's products (or benefits in terms of EJ B2B API)
        /// </summary>
        [DataMember(Name = "products")]
        public List<Product> Products { get; set; }
    }

    /// <summary>
    /// Seat's product (or benefit in terms of EJ B2B API)
    /// </summary>
    [DataContract]
    [Serializable]
    public class Product
    {
        /// <summary>
        /// Product ID
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Product name
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Product description
        /// </summary>
        [DataMember(Name = "description")]
        public string Description { get; set; }

        /// <summary>
        /// Product icon
        /// </summary>
        [DataMember(Name = "icon")]
        public string Icon { get; set; }
    }
}