using easyJet.Holidays.Api.Domain.Data.Attributes;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Booking
{
    /// <summary>
    /// Object, that holds parameters for advanced search
    /// </summary>
    [ValidAdvancedSearchRequest]
    public class AdvancedBookingSearchRequest
    {
        public string LeadPassengerName { get; set; }

        public DateTime? HolidayStart { get; set; }

        public DateTime? HolidayEnd { get; set; }

        public DateTime? BookingFrom { get; set; }

        public DateTime? BookingTo { get; set; }

        public DateTime? ExactBookingDate { get; set; }

        public BookingType BookingType { get; set; }

        public SearchSort SearchSort { get; set; } = new SearchSort();

        [Range(0, 1000)]
        public int? ResultsPerPage { get; set; }

        [Range(0, int.MaxValue)]
        public int? PageNumber { get; set; }

        public string SearchSessionId { get; set; }

    }

    public enum BookingType
    {
        All,
        Confirmed,
        Cancelled
    }

    public class SearchSort
    {
        public SortOrder SortOrder { get; set; }
        public SortDirection SortDirection { get; set; }
    }

    public enum SortOrder
    {
        BOOKING_DATE,

        /// <summary>
        /// Holiday start date
        /// </summary>
        ST_DT
    }

    public enum SortDirection
    {
        Ascending,
        Descending
    }
}