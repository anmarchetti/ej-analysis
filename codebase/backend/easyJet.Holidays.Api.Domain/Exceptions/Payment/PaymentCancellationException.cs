using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    public class PaymentCancellationException : Exception
    {

        public ApiError[] Errors { get; }

        public PaymentCancellationException(string message, string bookingReference, ApiError[] errors, Exception innerException)
            : base(message, innerException)
        {
            Errors = errors;
        }
    }
}
