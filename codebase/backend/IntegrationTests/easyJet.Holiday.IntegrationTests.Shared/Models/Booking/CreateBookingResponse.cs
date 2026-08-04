using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public class CreateBookingResponse
{
    public BookingResponse BookingResponse { get; set; }

    public CustomerInfo Customer { get; set; }

    public CustomerCredentials? CustomerCredentials { get; set; }
}