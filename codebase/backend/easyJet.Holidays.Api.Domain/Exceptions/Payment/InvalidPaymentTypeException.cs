namespace easyJet.Holidays.Api.Domain.Exceptions.Payment
{
    /// <summary>
    /// Business exception to encapsulate PaymentType errors
    /// </summary>
    public class InvalidPaymentTypeException : Exception
    {
        /// <inheritdoc />
        public InvalidPaymentTypeException(string message, Exception innerException)
            : base(message, innerException)
        {
        }

        /// <inheritdoc />
        protected InvalidPaymentTypeException()
        {
        }

        /// <inheritdoc />
        public InvalidPaymentTypeException(string message) : base(message)
        {
        }
    }
}
