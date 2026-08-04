using easyJet.Holidays.Api.Domain.Data.Settings;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
    public class CurrencyCodeAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var currency = value as string;

            if (string.IsNullOrEmpty(currency))
            {
                return ValidationResult.Success;
            }

            var callCentreSettingsOptions = validationContext.GetService(typeof(IOptions<CallCentreSettings>)) as IOptions<CallCentreSettings>;
            var callCentreSettings = callCentreSettingsOptions.Value;

            if (callCentreSettings.Currencies.Contains(value.ToString(), StringComparer.Ordinal))
            {
                return ValidationResult.Success;
            }

            return new ValidationResult($"The field '{validationContext.DisplayName}' must be a valid currency code.");
        }
    }

}
