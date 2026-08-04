using easyJet.Holidays.External.Cms.Models.Promotion;
using FluentValidation;

namespace easyJet.Holidays.External.Cms.Mappers;

/// <summary>
/// Promotion Code Validator.
/// </summary>
public class PromotionCodeValidator: AbstractValidator<ValidateCmsBooking>
{
    /// <summary>
    /// Inititalizes Promotion Code Validator.
    /// </summary>
    /// <param name="cascadeMode">Cascade Mode.</param>
    /// <param name="validationRules">Promo Code Validation Rules.</param>
    public PromotionCodeValidator(CascadeMode cascadeMode, PromotionCodeValidationRules validationRules)
    {
        ClassLevelCascadeMode = cascadeMode;
        
        if (validationRules?.DateRangeOfValidity != null)
        {
            var dateRange = validationRules.DateRangeOfValidity.Criteria;
            RuleFor(r => r.BookingDate)
                .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                .WithMessage(validationRules.DateRangeOfValidity.ValidationResult.Message)
                .WithErrorCode(validationRules.DateRangeOfValidity.ValidationResult.Code);
        }
        
        if (validationRules?.TotalPrice != null)
        {
            RuleFor(r => r.TotalPrice)
                .GreaterThanOrEqualTo(validationRules.TotalPrice.Criteria ?? 0)
                .WithMessage(validationRules.TotalPrice.ValidationResult.Message)
                .WithErrorCode(validationRules.TotalPrice.ValidationResult.Code);
        }
        else if (validationRules?.PerPersonPrice != null)
        {
            RuleFor(r => r.PerPersonPrice)
                .GreaterThanOrEqualTo(validationRules.PerPersonPrice.Criteria ?? 0)
                .WithMessage(validationRules.PerPersonPrice.ValidationResult.Message)
                .WithErrorCode(validationRules.PerPersonPrice.ValidationResult.Code);
        }
    }
}