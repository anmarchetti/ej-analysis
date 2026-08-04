using easyJet.Holidays.Api.Domain.Extensions;
using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.RoomVariants
{
    /// <summary>
    /// Accommodation offer search request
    /// </summary>
    public class AccommodationOfferRequest : RoomVariantsSearchRequest, IValidatableObject
    {
        /// <summary>
        /// Whether include Late room checkout (if available) or not
        /// </summary>
        public bool LateRoomCheckout { get; set; }

        /// <summary>
        /// Selected seat numbers separated by |, Seats[0] for the outbound flight, Seats[1] for the inbound
        /// </summary>
        public List<string> Seats { get; set; }

        [IgnoreDataMember]
        public List<string> OutboundSeats => ParseSeatNumbers(Seats, true);

        [IgnoreDataMember]
        public List<string> InboundSeats => ParseSeatNumbers(Seats, false);

        /// <summary>
        /// Selected extra luggage separated by '|', lug[0] - adults, lug[1] - children, lug[2] - infants
        /// </summary>
        [FromQuery(Name = "lug")]
        public List<string> Luggage { get; set; }

        /// <summary>
        /// Selected large cabin bags for inbound flight per passenger
        /// </summary>
        [FromQuery(Name = "lcbIn")]
        public string LcbIn { get; set; }

        /// <summary>
        /// Selected large cabin bags for outbound flight per passenger
        /// </summary>
        [FromQuery(Name = "lcbOut")]
        public string LcbOut { get; set; }

        /// <summary>
        /// Used to fetch data from external services as an ID for the airport parking.
        /// </summary>
        [FromQuery(Name = "airportParkingCode")]
        public string AirportParkingCode { get; set; }

        /// <summary>
        /// Price from search results page
        /// </summary>
        [FromQuery(Name = "searchPrice")]
        public decimal? SearchPrice { get; set; }

        /// <summary>
        /// All rooms should have roomCode-s
        /// </summary>
        /// <param name="validationContext">Validation context</param>
        /// <returns>Collection of errors</returns>
        public new IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var baseValidationResults = base.Validate(validationContext);
            foreach (var result in baseValidationResults)
            {
                yield return result;
            }

            // Base class has Room require validation
            foreach (var room in Room)
            {
                if (string.IsNullOrEmpty(room.RoomCode))
                {
                    yield return new ValidationResult($"RoomCode is required.");
                }
            }
        }

        private static List<string> ParseSeatNumbers(List<string> seatsList, bool isOutbound)
        {
            if (seatsList.IsNullOrEmpty() || seatsList.Count != 2)
            {
                return null;
            }

            string seats = isOutbound ? seatsList[0] : seatsList[1];
            return string.IsNullOrWhiteSpace(seats) ? null : seats.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries).ToList();
        }
    }
}
