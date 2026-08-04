using easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Seats
{
    /// <summary>
    /// Get seats map request
    /// </summary>
    public class GetSeatsMapRequest : IValidatableObject
    {
        /// <summary>
        /// Departure airport code (Ex. 'LTN', 'EDI')
        /// </summary>
        [Iata]
        [Required]
        public string DepAirportCode { get; set; }

        /// <summary>
        /// Arrival airport code (Ex. 'LTN', 'EDI')
        /// </summary>
        [Iata]
        [Required]
        public string ArrAirportCode { get; set; }

        /// <summary>
        /// Flight departure date. Use ISO Format yyyy-MM-dd
        /// </summary>
        [Required]
        public string DepartureDate { get; set; }

        /// <summary>
        /// Flight number (Ex. 7415, 6578)
        /// </summary>
        [Required]
        public int FlightNumber { get; set; }


        /// <summary>
        /// Indicates if flight is outbound or not.
        /// </summary>
        public bool IsOutboundFlight { get; set; }

        /// <summary>
        /// Currency code of departure airport (Ex.  'EUR','CHF')
        /// </summary>
        public string CurrencyCode { get; set; }

        /// <summary>
        /// The fare class for which the seat plan and prices are to be retrieved
        /// </summary>
        public string FareClass { get; set; }

        /// <summary>
        /// Passenger has ejPlus card
        /// </summary>
        [YesNo]
        public string HaseEjPlusCard { get; set; }

        /// <summary>
        /// Passenger is a pregnant female
        /// </summary>
        [YesNo]
        public string Pregnant { get; set; }

        /// <summary>
        /// Passenger is travelling with an infant
        /// </summary>
        [YesNo]
        public string InfantOnLap { get; set; }

        /// <summary>
        /// Passenger has any kind of disability
        /// </summary>
        [YesNo]
        public string Disability { get; set; }

        /// <summary>
        /// Passenger has any kind of disability
        /// </summary>
        [YesNo]
        public string PhysicalDisorder { get; set; }

        /// <summary>
        /// Passenger is a child under 16 years of age
        /// </summary>
        [YesNo]
        public string Child { get; set; }

        /// <summary>
        /// Passenger is elderly or frag
        /// </summary>
        [YesNo]
        public string Fragile { get; set; }


        /// <summary>
        /// Promotional code with the seat map request.
        /// </summary>
        public string Promo { get; set; }

        public GetSeatsMapRequest() { }

        public GetSeatsMapRequest(Route route, string currencyCode)
        {
            #region Argument checks

            if (route == null)
            {
                throw new ArgumentNullException(nameof(route));
            }

            if (string.IsNullOrWhiteSpace(route.FlightNumberWithoutCar) || !int.TryParse(route.FlightNumberWithoutCar, out int flightNumber))
            {
                throw new ArgumentException("Route Flight Number is incorrect", nameof(route));
            }

            if (string.IsNullOrWhiteSpace(route.DepPt))
            {
                throw new ArgumentException("Route DepPt is null or empty", nameof(route));
            }

            if (string.IsNullOrWhiteSpace(route.ArrPt))
            {
                throw new ArgumentException("Route ArrPt is null or empty", nameof(route));
            }

            if (!route.DepDate.HasValue)
            {
                throw new ArgumentException("Route DepDate does not have a value", nameof(route));
            }

            #endregion

            FlightNumber = flightNumber;
            DepAirportCode = route.DepPt;
            ArrAirportCode = route.ArrPt;
            DepartureDate = route.DepDate.Value.Date.ToString("yyy-MM-dd");
            IsOutboundFlight = route.Direction == Direction.Outbound;
            CurrencyCode = currencyCode;
        }

        /// <summary>
        /// Validating method
        /// </summary>
        /// <param name="validationContext"></param>
        /// <returns></returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (FlightNumber <= 0)
            {
                yield return new ValidationResult($"The flight number must be provided");
            }
        }
    }
}
