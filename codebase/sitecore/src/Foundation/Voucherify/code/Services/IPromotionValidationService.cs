using System.Collections.Generic;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;
using easyJet.Foundation.Voucherify.Models.Responses;

namespace easyJet.Foundation.Voucherify.Validator
{
    public interface IPromotionValidationService
    {
        /// <summary>
        /// Validate booking criteria against promotion.
        /// </summary>
        /// <param name="promotion">Promotion.</param>
        /// <param name="validateBooking">Validate booking model.</param>
        /// <returns>Collections of validation failure.</returns>
        List<ValidationFailure> Validate(Promotion promotion, ValidateBooking validateBooking);

        /// <summary>
        /// Validate booking criteria against promotion code and promotions.
        /// </summary>
        /// <param name="promotionCode">Promotion Code.</param>
        /// <param name="validateBooking">Validate booking model.</param>
        /// <returns>Collections of validation failure.</returns>
        List<ValidationFailure> Validate(PromotionCode promotionCode, ValidateBooking validateBooking);

        /// <summary>
        /// Validates request and matches best promocode.
        /// </summary>
        /// <param name="request">Validate booking model.</param>
        /// <param name="promotions">Promotions.</param>
        /// <returns>Validation response. </returns>
        ValidatePromotionResponse ValidateBooking(ValidateBookingRequest request, IReadOnlyCollection<Promotion> promotions);
    }
}