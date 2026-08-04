namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Models
{
    /// <summary>
    /// DistressedInputDataRow class
    /// </summary>
    public class DistressedInputDataRow
    {
        /// <summary>
        /// Segment
        /// </summary>
        public string Segment { get; set; }

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
        /// LocalCurrency
        /// </summary>
        public string LocalCurrency { get; set; }

        /// <summary>
        /// DiscountType
        /// </summary>
        public string DiscountType { get; set; }

        /// <summary>
        /// DiscountedSeats
        /// </summary>
        public string DiscountedSeats { get; set; }

        /// <summary>
        /// NonDiscountedFare_GBP
        /// </summary>
        public string NonDiscountedFare_GBP { get; set; }

        /// <summary>
        /// DiscountedFare_GBP
        /// </summary>
        public string DiscountedFare_GBP { get; set; }

        /// <summary>
        /// NonDiscountedFare_EUR
        /// </summary>
        public string NonDiscountedFare_EUR { get; set; }

        /// <summary>
        /// DiscountedFare_EUR
        /// </summary>
        public string DiscountedFare_EUR { get; set; }

        /// <summary>
        /// NonDiscountedFare_CHF
        /// </summary>
        public string NonDiscountedFare_CHF { get; set; }

        /// <summary>
        /// DiscountedFare_CHF
        /// </summary>
        public string DiscountedFare_CHF { get; set; }

        /// <summary>
        /// NonDiscountedFare_USD
        /// </summary>
        public string NonDiscountedFare_USD { get; set; }

        /// <summary>
        /// DiscountedFare_USD
        /// </summary>
        public string DiscountedFare_USD { get; set; }

        /// <summary>
        /// NonDiscountedFare_CSK
        /// </summary>
        public string NonDiscountedFare_CSK { get; set; }

        /// <summary>
        /// DiscountedFare_CSK
        /// </summary>
        public string DiscountedFare_CSK { get; set; }

        /// <summary>
        /// NonDiscountedFare_HUF
        /// </summary>
        public string NonDiscountedFare_HUF { get; set; }

        /// <summary>
        /// DiscountedFare_HUF
        /// </summary>
        public string DiscountedFare_HUF { get; set; }

        /// <summary>
        /// NonDiscountedFare_DKK
        /// </summary>
        public string NonDiscountedFare_DKK { get; set; }

        /// <summary>
        /// DiscountedFare_DKK
        /// </summary>
        public string DiscountedFare_DKK { get; set; }

        /// <summary>
        /// NonDiscountedFare_PLN
        /// </summary>
        public string NonDiscountedFare_PLN { get; set; }

        /// <summary>
        /// DiscountedFare_PLN
        /// </summary>
        public string DiscountedFare_PLN { get; set; }

        /// <summary>
        /// NonDiscountedFare_SEK
        /// </summary>
        public string NonDiscountedFare_SEK { get; set; }

        /// <summary>
        /// DiscountedFare_SEK
        /// </summary>
        public string DiscountedFare_SEK { get; set; }

        /// <summary>
        /// NonDiscountedFare_MAD
        /// </summary>
        public string NonDiscountedFare_MAD { get; set; }

        /// <summary>
        /// DiscountedFare_MAD
        /// </summary>
        public string DiscountedFare_MAD { get; set; }

        /// <summary>
        /// RunDate
        /// </summary>
        public string RunDate { get; set; }

        /// <summary>
        /// Sector
        /// </summary>
        public string Sector => $"{DepartureAirport}{ArrivalAirport}".ToUpperInvariant();
    }
}