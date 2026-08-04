using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public class ValidDepartureDateAttribute : ValidationAttribute
{
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        var departureDate = (DateTime)value;
        if (departureDate <= DateTime.UtcNow.Date)
        {
            return new ValidationResult($"The date, specified in {validationContext.DisplayName} field, should be in future.");
        }

        return ValidationResult.Success;
    }
}