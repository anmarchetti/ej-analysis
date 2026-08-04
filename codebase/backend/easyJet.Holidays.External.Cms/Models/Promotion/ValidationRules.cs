using easyJet.Holidays.Api.Domain.Data.Common;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.External.Cms.Models.Common;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    /// <summary>
    /// Validation rules model.
    /// </summary>
    public class ValidationRules
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
        /// Gets or sets validation rule for booking's valid hotel types.
        /// </summary>
        public ValidationRule<List<DatasourceObject>> HotelTypes { get; set; }
        
        /// <summary>
        /// Gets or sets validation rule for booking's valid promo collections.
        /// </summary>
        public ValidationRule<List<KeyedPromotion>> PromoCollectionCodes { get; set; }

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

    /// <summary>
    /// Validation rule model.
    /// </summary>
    /// <typeparam name="T">Type of validation criteria.</typeparam>
    public class ValidationRule<T>
    {
        /// <summary>
        /// Gets or sets validation criteria.
        /// </summary>
        public T Criteria { get; set; }

        /// <summary>
        /// Gets or sets validation result.
        /// </summary>
        public ValidationResult ValidationResult { get; set; }
    }

    /// <summary>
    /// Validation result model.
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// Gets code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets message.
        /// </summary>
        public string Message { get; set; }
    }

}