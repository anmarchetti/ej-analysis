namespace easyJet.Foundation.Voucherify.Models.Domain
{
    /// <summary>
    /// Validation failure model.
    /// </summary>
    public class ValidationFailure
    {
        /// <summary>
        /// Gets or Sets code.
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Gets or Sets message.
        /// </summary>
        public string Message { get; set; }
    }
}