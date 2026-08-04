using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Booking validation request model
    /// </summary>
    [Serializable]
    [DataContract]
    public class ValidateBookingRequest
    {
        /// <summary>
        /// Booking token which identifies that we are going to change booking
        /// </summary>
        [DataMember(Name = "bookingToken")]
        public string BookingToken { get; set; }

        /// <summary>
        /// Whether price should be not rounded
        /// </summary>
        [DataMember(Name = "norounding")]
        public bool NoRoundingPrice { get; set; }

        /// <summary>
        /// Lists of passengers to validate booking
        /// </summary>
        [DataMember(Name = "guests")]
        [Required]
        public List<Person> Guests { get; set; }

        /// <summary>
        /// Selected offer
        /// </summary>
        [DataMember(Name = "offer")]
        [Required]
        public Offer Offer { get; set; }

        /// <summary>
        /// Discount code
        /// </summary>
        [DataMember(Name = "discount")]
        public string DiscountCode { get; set; }

        //TODO Remove after implementing errata with geog level
        [DataMember(Name = "page")]
        public Pages? Page { get; set; }

        /// <summary>
        /// Seat selection data
        /// </summary>
        [DataMember(Name = "seatSelection")]
        public List<SeatMap> SeatSelection { get; set; }

        /// <summary>
        /// Luggage to book
        /// </summary>
        [DataMember(Name = "extraLuggageInfo")]
        public ExtraLuggageInfo ExtraLuggageInfo { get; set; }

        /// <summary>
        /// Airport Parking Item
        /// </summary>
        [DataMember(Name = "airportParking")]
        public AirportParkingItem AirportParking { get; set; }

        /// <summary>
        /// Create Validate Booking Request from Booking request
        /// </summary>
        /// <param name="bookingRequest">Booking request</param>
        /// <returns>validate package request</returns>
        public static ValidateBookingRequest FromBookingRequest(BookingRequest bookingRequest)
        {
            return new ValidateBookingRequest
            {
                Offer = bookingRequest.Offer,
                DiscountCode = bookingRequest.DiscountCode,
                Guests = bookingRequest.Guests.Select(g => new Person
                {
                    Age = g.Age,
                    Sex = g.Sex,
                    Type = g.Type
                }).ToList(),
                SeatSelection = bookingRequest.SeatSelection,
                ExtraLuggageInfo = bookingRequest.ExtraLuggageInfo,
                AirportParking = bookingRequest.AirportParking
            };
        }
    }

    //TODO Remove after implementing errata with geog level
    public enum Pages
    {
        GuestDetails
    }
}
