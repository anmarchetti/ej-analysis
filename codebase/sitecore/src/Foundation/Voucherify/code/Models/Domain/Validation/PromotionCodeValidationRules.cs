namespace easyJet.Foundation.Voucherify.Models.Domain.Validation
{
    /// <summary>
    /// Promotion Code Validation rules model.
    /// </summary>
    public class PromotionCodeValidationRules
    {
        /// <summary>
        /// Gets or sets validation rule for promotion date range of validity.
        /// </summary>
        public ValidationRule<DateTimeRange> DateRangeOfValidity { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's total price.
        /// </summary>
        public ValidationRule<decimal?> TotalPrice { get; set; }

        /// <summary>
        /// Gets or sets validation rule for booking's per person price.
        /// </summary>
        public ValidationRule<decimal?> PerPersonPrice { get; set; }
    }
}