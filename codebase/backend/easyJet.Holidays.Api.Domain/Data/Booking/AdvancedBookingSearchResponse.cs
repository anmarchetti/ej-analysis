namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Bookings, mapped from Atcom search request
    /// </summary>
    public class AdvancedBookingSearchResponse
    {
        /// <summary>
        /// Found bookings
        /// </summary>
        public IEnumerable<BookingSearchEntry> Bookings { get; set; }

        /// <summary>
        /// Indicates if there is ability to look through atcom search further
        /// </summary>
        public bool HasNextPage { get; set; }

        /// <summary>
        /// SessionId. should be specified in request, if particular page is requested
        /// </summary>
        public string SessionId { get; set; }
    }

    public class BookingSearchEntry
    {
        public string Id { get; set; }

        public string LeadPassengerLastName { get; set; }

        public DateTime HolidayStart { get; set; }

        public DateTime HolidayEnd { get; set; }

        public DateTime BookingDate { get; set; }

        public BookingType Status { get; set; }
    }
}