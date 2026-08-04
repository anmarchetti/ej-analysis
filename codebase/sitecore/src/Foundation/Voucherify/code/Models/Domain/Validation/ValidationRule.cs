namespace easyJet.Foundation.Voucherify.Models.Domain.Validation
{
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
}