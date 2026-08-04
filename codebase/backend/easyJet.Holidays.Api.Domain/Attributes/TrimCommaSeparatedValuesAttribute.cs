using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Attributes
{
    /// <summary>
    /// Attribute that trims whitespace from comma-separated values in a string property.
    /// Removes empty values and ensures consistent formatting.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public sealed class TrimCommaSeparatedValuesAttribute : ValidationAttribute
    {
        /// <summary>
        /// Validates the input value and trims whitespace from comma-separated values.
        /// </summary>
        /// <param name="value">The value to validate.</param>
        /// <param name="validationContext">The context information about the validation operation.</param>
        /// <returns>ValidationResult.Success if the validation is successful.</returns>
        /// <exception cref="ArgumentNullException">Thrown when validationContext is null.</exception>
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            ArgumentNullException.ThrowIfNull(validationContext);

            if (string.IsNullOrEmpty(validationContext.MemberName))
            {
                return ValidationResult.Success;
            }

            if (value == null)
            {
                return ValidationResult.Success;
            }

            var stringValue = value.ToString();
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                return ValidationResult.Success;
            }

            var trimmedValues = stringValue
                .Split(',')
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim());

            var property = validationContext.ObjectType.GetProperty(validationContext.MemberName);
            if (property != null)
            {
                property.SetValue(validationContext.ObjectInstance, string.Join(",", trimmedValues));
            }

            return ValidationResult.Success;
        }
    }
} 