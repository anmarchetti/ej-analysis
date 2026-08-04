using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public class DisplayBookingRequest
{
    public CustomerCredentials Credentials { get; set; }

    [AliasAs("bookingReference")]
    public string BookingReference { get; set; }

    [AliasAs("lastName")]
    public string LastName { get; set; }

    [AliasAs("date")]
    public string Date { get; set; }
}