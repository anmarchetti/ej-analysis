using System;
using System.Collections.Generic;

namespace easyJet.Foundation.Voucherify.Models.Requests
{
    /// <summary>
    /// Validate booking request.
    /// </summary>
    public class ValidateBookingRequest : BasePromoCodesRequest
    {
        /// <summary>
        /// Gets or sets voucher code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Gets or sets departure airport.
        /// </summary>
        public string Airport { get; set; }

        /// <summary>
        /// Gets or sets booking date.
        /// </summary>
        public DateTime? BookingDate { get; set; }

        /// <summary>
        /// Gets or sets hotel code.
        /// </summary>
        public string HotelCode { get; set; }

        /// <summary>
        /// Gets or sets departure Date.
        /// </summary>
        public DateTimeOffset DepartureDate { get; set; }

        /// <summary>
        /// Gets or sets return Date.
        /// </summary>
        public DateTimeOffset ReturnDate { get; set; }

        /// <summary>
        /// Gets or sets duration of stay.
        /// </summary>
        public byte? Duration { get; set; }

        /// <summary>
        /// Gets or sets holiday Types.
        /// </summary>
        public string HolidayType { get; set; }

        /// <summary>
        /// Gets or sets hotel type.
        /// </summary>
        public string HotelType { get; set; }

        /// <summary>
        /// Gets or sets promo collection code.
        /// </summary>
        public string PromoCollectionCode { get; set; }

        /// <summary>
        /// Gets or sets holiday Theme.
        /// </summary>
        public string HolidayTheme { get; set; }

        /// <summary>
        /// Gets or sets board Type.
        /// </summary>
        public string BoardType { get; set; }

        /// <summary>
        /// Gets or sets price.
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Gets or sets price per person.
        /// </summary>
        public decimal PricePP { get; set; }

        /// <summary>
        /// Gets or sets number of adults.
        /// </summary>
        public int? NAdults { get; set; }

        /// <summary>
        /// Gets or sets number of children.
        /// </summary>
        public int? NChildren { get; set; }

        /// <summary>
        /// Gets or sets number of infants.
        /// </summary>
        public int? NInfants { get; set; }

        /// <summary>
        /// Gets or sets offer id.
        /// </summary>
        public string Id { get; set; }
    }
}