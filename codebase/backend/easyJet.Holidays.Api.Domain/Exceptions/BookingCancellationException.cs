using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.Api.Domain.Exceptions
{
    /// <summary>
    /// Booking cancellation exception model
    /// </summary>
    public class BookingCancellationException : ApiException
    {
        /// <summary>
        ///Booking reference for cancellation exception
        /// </summary>
        public string BookingReference { get; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="code">Exception code</param>
        /// <param name="message">Message</param>
        /// <param name="bookingReference">Booking reference</param>
        /// <param name="innerErrors">Inner exception errors</param>
        /// <param name="innerException">Inner exception</param>
        public BookingCancellationException(ExceptionCode code, string message, string bookingReference, ApiError[] innerErrors, Exception innerException)
            : base(code, message, innerErrors, innerException)
        {
            BookingReference = bookingReference;
        }
    }
}
