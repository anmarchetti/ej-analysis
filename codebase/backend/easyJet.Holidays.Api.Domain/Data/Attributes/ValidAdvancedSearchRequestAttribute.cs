using easyJet.Holidays.Api.Domain.Data.Booking;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter | AttributeTargets.Class)]
    public class ValidAdvancedSearchRequestAttribute : ValidationAttribute
    {
        public override bool IsValid(object value)
        {
            var request = value as AdvancedBookingSearchRequest;
            if (request == null)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(request.LeadPassengerName)
                && request.BookingFrom == default
                && request.BookingTo == default
                && request.ExactBookingDate == default
                && request.HolidayStart == default
                && request.HolidayEnd == default)
            {
                return false;
            }

            return true;
        }
    }
}