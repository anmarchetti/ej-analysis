using System.Collections.Generic;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Requests;

namespace easyJet.Foundation.Voucherify.Services
{
    public interface IPromotionService
    {
        /// <summary>
        /// Get Promotions by code.
        /// </summary>
        /// <param name="code">Voucher code.</param>
        /// <param name="marketCode">Market code.</param>
        /// <returns>Promotion Items.</returns>
        IReadOnlyCollection<Promotion> GetPromotionsByCode(string code, string marketCode);

        /// <summary>
        /// promotion by atcom promo code.
        /// </summary>
        /// <param name="code">atcom promo code.</param>
        /// <param name="marketCode">Market code.</param>
        /// <param name="returnAll">Value that indicates whether it need to return all promotion codes or only matching one.</param>
        /// <returns>Promotion.</returns>
        Promotion GetPromotionByAtcomPromoCode(string code, string marketCode, bool returnAll = false);

        /// <summary>
        /// Get all Promotions.
        /// </summary>
        /// <param name="marketCode">Market code.</param>
        /// <returns>Promotion Items.</returns>
        IEnumerable<Promotion> GetAll(string marketCode);

        /// <summary>
        /// Match promocode for each offer based on voucherCode input.
        /// </summary>
        /// <param name="voucherCode">atcom voucher code.</param>
        /// <param name="validateBookingRequests">list of offers to match.</param>
        /// <param name="marketCode">Market code.</param>
        /// <returns>Dictionary with key as offer id and couhcer discounts as values.</returns>
        Dictionary<string, PromocodeDiscounts> MatchPromocodeForOffers(string voucherCode, IEnumerable<ValidateBookingRequest> validateBookingRequests, string marketCode);
    }
}