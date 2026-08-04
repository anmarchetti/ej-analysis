using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    public class PaymentGatewayException : Exception
    {
        public string BookingReference { get; }

        public string SessionId { get; }

        public ApiError[] Errors { get; }

        public PaymentGatewayException(string message, string bookingReference, string sessionId, ApiError[] errors, Exception innerException)
            : base(message, innerException)
        {
            BookingReference = bookingReference;
            SessionId = sessionId;
            Errors = errors;
        }
    }
}
