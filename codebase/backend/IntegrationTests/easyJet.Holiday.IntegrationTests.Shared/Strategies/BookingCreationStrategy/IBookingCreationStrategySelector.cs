namespace easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy
{
    [Obsolete]
    public interface IBookingCreationStrategySelector
    {
        IBookingCreationStrategy Select(BookingCreationCause bookingCreationCause);
    }
}
