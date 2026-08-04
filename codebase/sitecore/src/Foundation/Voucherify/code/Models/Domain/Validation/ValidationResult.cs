using System;

namespace easyJet.Foundation.Voucherify.Models.Domain.Validation
{
    /// <summary>
    /// Validation result model.
    /// </summary>
    public class ValidationResult
    {
        private readonly Lazy<string> message;

        public ValidationResult(string code, Func<string> getError)
        {
            Code = code;
            message = new Lazy<string>(getError);
        }

        /// <summary>
        /// Gets code.
        /// </summary>
        public string Code { get; }

        /// <summary>
        /// Gets message.
        /// </summary>
        public string Message => message.Value;
    }
}