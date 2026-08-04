using System.Collections.Generic;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Models.Responses;
using easyJet.Foundation.Voucherify.Validator;
using FluentValidation;
using ValidationFailure = easyJet.Foundation.Voucherify.Models.Domain.ValidationFailure;
using ValidationResult = FluentValidation.Results.ValidationResult;

namespace easyJet.Foundation.Voucherify.Services
{
    [Service(typeof(IPromotionValidationService), Lifetime = Lifetime.Transient)]

    public class PromotionValidationService : IPromotionValidationService
    {
        private readonly IValidateBookingRequestMapper validateBookingRequestMapper;

        public PromotionValidationService(IValidateBookingRequestMapper validateBookingRequestMapper)
        {
            this.validateBookingRequestMapper = validateBookingRequestMapper;
        }

        /// <inheritdoc/>
        public List<ValidationFailure> Validate(Promotion promotion, ValidateBooking validateBooking)
        {
            var result = Validate(promotion.ValidationRules, validateBooking, CascadeMode.Continue);
            var validationResult = new List<ValidationFailure>();

            if (result.IsValid)
            {
                return validationResult;
            }

            foreach (var error in result.Errors)
            {
                validationResult.Add(new ValidationFailure
                {
                    Code = error.ErrorCode,
                    Message = error.ErrorMessage
                });
            }

            return validationResult;
        }

        /// <inheritdoc/>
        public List<ValidationFailure> Validate(PromotionCode promotionCode, ValidateBooking validateBooking)
        {
            var result = Validate(promotionCode.ValidationRules, validateBooking, CascadeMode.Continue);
            var validationResult = new List<ValidationFailure>();

            if (result.IsValid)
            {
                return validationResult;
            }

            foreach (var error in result.Errors)
            {
                validationResult.Add(new ValidationFailure
                {
                    Code = error.ErrorCode,
                    Message = error.ErrorMessage
                });
            }

            return validationResult;
        }

        public ValidatePromotionResponse ValidateBooking(ValidateBookingRequest request, IReadOnlyCollection<Promotion> promotions)
        {
            ValidatePromotionResponse response = null;
            foreach (var promotion in promotions)
            {
                response = ValidateBooking(request, promotion);

                // if in returned response validation result is empty that means booking is valid for this promotion
                if (response.ValidationResults.Count <= 0)
                {
                    return response;
                }
            }

            return response;
        }

        private static ValidationResult Validate(PromotionValidationRules rules, ValidateBooking validateBooking, CascadeMode cascadeMode)
        {
            return new PromotionValidator(cascadeMode, rules).Validate(validateBooking);
        }

        private static ValidationResult Validate(PromotionCodeValidationRules rules, ValidateBooking validateBooking, CascadeMode cascadeMode)
        {
            return new PromotionCodeValidator(cascadeMode, rules).Validate(validateBooking);
        }

        private ValidatePromotionResponse ValidateBooking(ValidateBookingRequest request, Promotion promotion)
        {
            var validateBooking = validateBookingRequestMapper.MapFromValidateBookingRequest(new[] { request }).First();

            ValidatePromotionResponse response = null;

            var validationResults = Validate(promotion, validateBooking);

            // check promo configuration first if there are errors return and populate promo code with the minimum price tier
            if (validationResults.Count > 0)
            {
                response = new ValidatePromotionResponse { ValidationResults = validationResults, VoucherCode = promotion.PromotionCodes.LastOrDefault()?.Id };
                return response;
            }

            // check promo code price configuration second
            // Return first promotion which matches necessary criteria.
            // If we don't have promotion with necessary criteria then return validation results by last promotion (which has necessary voucher code).
            foreach (var promotionCode in promotion.PromotionCodes)
            {
                var validationErrors = Validate(promotionCode, validateBooking);

                response = new ValidatePromotionResponse
                {
                    ValidationResults = validationErrors,
                    VoucherCode = promotionCode.Id
                };

                if (validationErrors.Count <= 0)
                {
                    break;
                }
            }

            return response;
        }
    }
}