namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class ValidatePromotionBase : BasePromoCodesRequest
    {
        /// <summary>
        /// Departure airport.
        /// </summary>
        public string Airport { get; set; }

        /// <summary>
        /// Booking date.
        /// </summary>
        public DateTime? BookingDate { get; set; }

        /// <summary>
        /// Hotel code.
        /// </summary>
        public string HotelCode { get; set; }

        /// <summary>
        /// Departure Date.
        /// </summary>
        public DateTimeOffset? DepartureDate { get; set; }

        /// <summary>
        /// Return Date.
        /// </summary>
        public DateTimeOffset? ReturnDate { get; set; }

        /// <summary>
        /// Duration of stay.
        /// </summary>
        public byte? Duration { get; set; }

        /// <summary>
        /// Holiday Types.
        /// </summary>
        public string HolidayType { get; set; }

        /// <summary>
        /// Holiday Theme.
        /// </summary>
        public string HolidayTheme { get; set; }

        /// <summary>
        /// Hotel Type (facility matrix).
        /// </summary>
        public string HotelType { get; set; }

        /// <summary>
        /// Promo Collection Code.
        /// </summary>
        public string PromoCollectionCode { get; set; }

        /// <summary>
        /// Board Type
        /// </summary>
        public string BoardType { get; set; }

        /// <summary>
        /// Price.
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Price per person.
        /// </summary>
        public decimal PricePP { get; set; }

        /// <summary>
        /// Number of adults.
        /// </summary>
        public int? NAdults { get; set; }

        /// <summary>
        /// Number of children.
        /// </summary>
        public int? NChildren { get; set; }

        /// <summary>
        /// Number of infants.
        /// </summary>
        public int? NInfants { get; set; }

        /// <summary>
        /// Discount code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Offer id.
        /// </summary>
        public string Id { get; set; }
    }
}
