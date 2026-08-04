using System.Collections.Generic;
using easyJet.Foundation.Voucherify.Models.Domain;

namespace easyJet.Foundation.Voucherify.Models.Requests
{
    /// <summary>
    /// Validate booking request.
    /// </summary>
    public class MatchPromocodesResponse
    {
        /// <summary>
        /// Gets or sets promocode discounts, key is a offer id.
        /// </summary>
        public Dictionary<string, PromocodeDiscounts> PromocodeDiscounts { get; set; }
    }
}