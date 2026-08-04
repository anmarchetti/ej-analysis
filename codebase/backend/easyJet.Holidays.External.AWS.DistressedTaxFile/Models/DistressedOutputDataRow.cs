namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Models
{
    /// <summary>
    /// DistressedOutputDataRow model
    /// </summary>
    public class DistressedOutputDataRow
    {
        /// <summary>
        /// FlightKey
        /// </summary>
        public string FlightKey { get; set; }

        /// <summary>
        /// DepartureAirport
        /// </summary>
        public string DepartureAirport { get; set; }

        /// <summary>
        /// ArrivalAirport
        /// </summary>
        public string ArrivalAirport { get; set; }

        /// <summary>
        /// FlightNumber
        /// </summary>
        public string FlightNumber { get; set; }

        /// <summary>
        /// DepartureDate
        /// </summary>
        public string DepartureDate { get; set; }

        /// <summary>
        /// DepartureTime
        /// </summary>
        public string DepartureTime { get; set; }

        /// <summary>
        /// ArrivalDate
        /// </summary>
        public string ArrivalDate { get; set; }

        /// <summary>
        /// ArrivalTime
        /// </summary>
        public string ArrivalTime { get; set; }

        /// <summary>
        /// NumberOfDistressedSeats
        /// </summary>
        public string NumberOfDistressedSeats { get; set; }

        /// <summary>
        /// Currency
        /// </summary>
        public string Currency { get; set; }

        /// <summary>
        /// DistressedAdultFare
        /// </summary>
        public string DistressedAdultFare { get; set; }

        /// <summary>
        /// Sector
        /// </summary>
        public string Sector => $"{DepartureAirport}{ArrivalAirport}".ToUpperInvariant();
    }
}