namespace easyJet.Holidays.Api.Domain.Exceptions.Payment
{
    /// <summary>
    /// Business exception to encapsulate ApplePay proxy errors
    /// </summary>
    public class ApplePayProxyException : Exception
    {
        /// <summary>
        /// Constructor for ApplePay proxy exception
        /// </summary>
        /// <param name="message"></param>
        /// <param name="innerException"></param>
        public ApplePayProxyException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        /// <inheritdoc />
        protected ApplePayProxyException()
        {
        }

        /// <inheritdoc />
        protected ApplePayProxyException(string message) : base(message)
        {
        }
    }
}
