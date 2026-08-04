using easyJet.Holiday.IntegrationTests.Shared.ModelConfiguration.Offers;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy
{
    [Obsolete]
    public interface IBookingCreationStrategy
    {
        BookingCreationCause BookingCreationCause { get; }

        Task<BookingResponse> CreateBooking(CustomerInfo customerInfo, string loginCookie, GetPackagesRequestFaker getPackagesRequestFaker);
    }
}
