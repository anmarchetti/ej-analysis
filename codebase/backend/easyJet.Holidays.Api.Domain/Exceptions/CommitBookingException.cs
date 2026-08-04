using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    public class CommitBookingException : Exception
    {
        public string BookingReference { get; }

        public string sessionId { get; }

        public string requestId { get; }

        public ApiError[] Errors { get; }

        public CommitBookingException(string message, string bookingReference, ApiError[] errors, string sessionId, string requestId, Exception innerException)
            : base(message, innerException)
        {
            BookingReference = bookingReference;
            this.sessionId = sessionId;
            this.requestId = requestId;
            Errors = errors;
        }
    }
}
