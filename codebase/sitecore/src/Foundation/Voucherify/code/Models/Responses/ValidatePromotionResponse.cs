using System.Collections.Generic;
using easyJet.Foundation.Voucherify.Models.Domain;
using easyJet.Foundation.Voucherify.Models.Domain.Validation;

namespace easyJet.Foundation.Voucherify.Models.Responses
{
    /// <summary>
    /// Validation promotion response model.
    /// </summary>
    public class ValidatePromotionResponse
    {
        /// <summary>
        /// Gets or sets voucher code.
        /// </summary>
        public string VoucherCode { get; set; }

        /// <summary>
        /// Gets or sets validation results.
        /// </summary>
        public List<ValidationFailure> ValidationResults { get; set; }
    }
}