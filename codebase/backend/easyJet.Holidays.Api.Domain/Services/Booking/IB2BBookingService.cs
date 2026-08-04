using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public interface IB2BBookingService
    {
        Task<B2BData> GetBooking(BookingResponse bookingResponse);
    }
}
