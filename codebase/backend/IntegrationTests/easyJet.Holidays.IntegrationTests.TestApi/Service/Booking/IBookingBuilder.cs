using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

public interface IBookingBuilder
{
    IBookingBuilder ForUser(CustomerCredentials? credentials, AgentCredentials? agentCredentials, bool isTradePortal = false);
    IBookingBuilder ShouldHaveAlternativeRooms();
    IBookingBuilder WithLanguage(string language);
    IBookingBuilder WithPayment(Payment payment);
    IBookingBuilder ApplyCreationParameters(BookingCreationParams creationParams);
    Task<CreateBookingResponse> Build();
    Task<CreateBookingsResponse> BuildMany(int numberOfBookings = 1);
}