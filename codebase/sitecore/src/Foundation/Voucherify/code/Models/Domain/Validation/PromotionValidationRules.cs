using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Voucherify.Models.Domain.Validation
{
    /// <summary>
    /// Promotion Validation rules model.
    /// </summary>
    public class PromotionValidationRules
    {
        /// <summary>
        /// Gets or sets validation rule for promotion date range of validity.
        /// </summary>
        public ValidationRule<DateTimeRange> DateRangeOfValidity { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid airports.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> Airports { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid destinations.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> Destinations { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid number of adults.
        /// </summary>
        public ValidationRule<int?> NAdults { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid number of children.
        /// </summary>
        public ValidationRule<int?> NChildren { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid number of infants.
        /// </summary>
        public ValidationRule<int?> NInfants { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid boards.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> Boards { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid holiday types.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> HolidayTypes { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid holiday themes.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> HolidayThemes { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid hotel types (facility matrix).
        /// </summary>
        public ValidationRule<List<DatasourceObject>> HotelTypes { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid promo collection codes.
        /// </summary>
        public ValidationRule<IList<PromoCollection>> PromoCollectionCodes { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid departure date.
        /// </summary>
        public ValidationRule<DateTimeRange> DepartureDate { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid return date.
        /// </summary>
        public ValidationRule<DateTimeRange> ReturnDate { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid exact duration.
        /// </summary>
        public ValidationRule<byte?> Duration { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid duration range.
        /// </summary>
        public ValidationRule<byte?> DurationRange { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid min duration.
        /// </summary>
        public ValidationRule<byte?> MinimumDuration { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's valid max duration.
        /// </summary>
        public ValidationRule<byte?> MaximumDuration { get; set; }
    }
}