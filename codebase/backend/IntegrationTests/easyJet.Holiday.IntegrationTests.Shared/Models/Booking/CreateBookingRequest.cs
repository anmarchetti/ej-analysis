using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public class CreateBookingRequest
{
    public CreateBookingRequest()
    {
        BookingCreationParams = new BookingCreationParams();
        Language = "en";
    }

    public BookingCreationParams BookingCreationParams { get; set; }
    public CustomerCredentials? CustomerCredentials { get; set; }
    public AgentCredentials? AgentCredentials { get; set; }
    public bool IsTradePortal { get; set; }
    public BookingCreationCause BookingCreationCause { get; set; }
    public Payment? Payment { get; set; }
    public string Language { get; set; }
    public int NumberOfBookings { get; set; } = 1;
}