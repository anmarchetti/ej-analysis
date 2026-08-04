namespace easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer
{
    /// <summary>
    /// Search request for alternative hotels
    /// </summary>
    public class AlternativeHotelsSearchRequest : AmendHotelBaseSearchRequest
    {
        /// <summary>
        /// List of promo codes
        /// </summary>
        public IEnumerable<string> Proms { get; set; }

        /// <summary>
        /// Accommodation code
        /// </summary>
        public string AccomCode { get; set; }

        /// <summary>
        /// Start date of the booking
        /// </summary>
        public string BookingStartDate { get; set; }

        /// <summary>
        /// Duration in days
        /// </summary>
        public int Duration { get; set; }

        /// <summary>
        /// Total price of routes
        /// </summary>
        public decimal RouteTotalPrice { get; set; }
    }
}
