using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;

namespace easyJet.Holidays.Api.Domain.Services.AmendBooking.AmendmentValidators.Utils
{
    public static class BookingResponseValidatorUtils
    {
        public static Route GetInboundFlight(BookingResponse bookingResponse) => bookingResponse.Package?.Transport?.Routes?.FirstOrDefault(route => route.Direction == Direction.Inbound);
        public static Route GetOutboundFlight(BookingResponse bookingResponse) => bookingResponse.Package?.Transport?.Routes?.FirstOrDefault(route => route.Direction == Direction.Outbound);
        public static double TotalHoursBeforeDeparture(BookingResponse bookingResponse)
        {
            var outboundFlight = GetOutboundFlight(bookingResponse);
            return outboundFlight?.DepDate != null ? (outboundFlight.DepDate.Value - DateTimeOffset.UtcNow).TotalHours : 0;
        }
    }
}