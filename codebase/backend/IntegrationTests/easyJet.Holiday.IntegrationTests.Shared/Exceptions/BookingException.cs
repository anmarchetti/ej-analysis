using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

namespace easyJet.Holiday.IntegrationTests.Shared.Exceptions;

public class BookingException : Exception
{
    public BookingAttempt? Attempt { get; }

    public string? Reason { get; }

    public BookingException(string reason, BookingAttempt attempt)
    {
        Reason = reason;
        Attempt = attempt;
    }

    public BookingException(string reason)
    {
        Reason = reason;
    }

    public BookingException(BookingAttempt attempt)
    {
        Attempt = attempt;
    }

    public BookingAttempt ToBookingAttempt()
    {
        return Attempt is not null ? Attempt : new BookingAttempt(Reason ?? "unknown error");
    }
}