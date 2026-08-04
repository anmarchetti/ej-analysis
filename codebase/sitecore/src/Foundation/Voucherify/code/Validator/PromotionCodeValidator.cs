using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using FluentValidation;

namespace easyJet.Foundation.Voucherify.Validator
{
    public class PromotionCodeValidator : AbstractValidator<ValidateBooking>
    {
        public PromotionCodeValidator(CascadeMode cascadeMode, PromotionCodeValidationRules promotionCodeValidationRules)
        {
            ClassLevelCascadeMode = cascadeMode;

            if (promotionCodeValidationRules.DateRangeOfValidity != null)
            {
                var dateRange = promotionCodeValidationRules.DateRangeOfValidity.Criteria;
                RuleFor(r => r.BookingDate)
                    .Must(bookingData => bookingData > dateRange.From && bookingData < dateRange.To)
                    .WithMessage(promotionCodeValidationRules.DateRangeOfValidity.ValidationResult.Message)
                    .WithErrorCode(promotionCodeValidationRules.DateRangeOfValidity.ValidationResult.Code);
            }

            if (promotionCodeValidationRules.TotalPrice != null)
            {
                RuleFor(r => r.TotalPrice)
                    .GreaterThanOrEqualTo(promotionCodeValidationRules.TotalPrice.Criteria.Value)
                    .WithMessage(promotionCodeValidationRules.TotalPrice.ValidationResult.Message)
                    .WithErrorCode(promotionCodeValidationRules.TotalPrice.ValidationResult.Code);
            }
            else if (promotionCodeValidationRules.PerPersonPrice != null)
            {
                RuleFor(r => r.PerPersonPrice)
                    .GreaterThanOrEqualTo(promotionCodeValidationRules.PerPersonPrice.Criteria.Value)
                    .WithMessage(promotionCodeValidationRules.PerPersonPrice.ValidationResult.Message)
                    .WithErrorCode(promotionCodeValidationRules.PerPersonPrice.ValidationResult.Code);
            }
        }
    }
}