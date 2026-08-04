namespace easyJet.Holiday.IntegrationTests.Shared.Strategies.BookingCreationStrategy
{
    [Obsolete]
    public class BookingCreationStrategySelector : IBookingCreationStrategySelector
    {
        private readonly IEnumerable<IBookingCreationStrategy> _creationstrategies;

        public BookingCreationStrategySelector(IEnumerable<IBookingCreationStrategy> creationstrategies)
        {
            _creationstrategies = creationstrategies ?? new List<IBookingCreationStrategy>();
        }

        public IBookingCreationStrategy Select(BookingCreationCause bookingCreationCause) => _creationstrategies.First(x => x.BookingCreationCause == bookingCreationCause);
    }
}
