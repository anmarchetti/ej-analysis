using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public class CreateBookingsResponse
{
    public CreateBookingsResponse()
    {
        Bookings = [];
        Attempts = [];
    }

    public IList<BookingResponse> Bookings { get; }

    public required CustomerInfo Customer { get; init; }

    public CustomerCredentials? CustomerCredentials { get; init; }

    public IList<BookingAttempt> Attempts { get; }
}
