using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using Refit;


namespace easyJet.Holiday.IntegrationTests.Shared.TestApi
{
    public interface ISharedServicesBookingTestApi
    {
        [Put("/BookingSharedServices/cancel-booking")]
        Task<ApiResponse<CancelBookingResponse>> CancelBooking(Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest request);
    }
}
