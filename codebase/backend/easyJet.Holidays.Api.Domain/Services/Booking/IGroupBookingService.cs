using easyJet.Holidays.Api.Domain.Data.Booking;

namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    public interface IGroupBookingService
    {
        Task Submit(GroupBookingRequest request);
    }
}