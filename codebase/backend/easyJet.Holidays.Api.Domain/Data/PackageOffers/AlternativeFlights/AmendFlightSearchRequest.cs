namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AlternativeFlights
{
    public class AmendFlightSearchRequest : AlternativeFlightsSearchRequest
    {
        /// <summary>
        /// Departure point. Multiple values can be specified as a comma separated list
        /// </summary>
        public new string Departure { get; set; }

        /// <summary>
        /// Optional selected transfer code
        /// </summary>
        public string Transfer { get; set; }

        /// <summary>
        /// Outbound flight number
        /// </summary>
        public string OutboundFlightNo { get; set; }

        /// <summary>
        /// Inbound flight number
        /// </summary>
        public string InboundFlightNo { get; set; }

        /// <summary>
        /// Promocode applied in booking
        /// </summary>
        public string DiscountCode { get; set; }

        /// <summary>
        /// Hotel theme code.
        /// </summary>
        public string Prom { get; set; }

        /// <summary>
        /// Booking ref.
        /// </summary>
        public string BookingReference { get; set; }
    }
}