using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface ISharedServicesBookingApi
    {
        [Put("/shared-services/booking/repository/cancel-booking")]
        Task<ApiResponse<BookingResponse>> CancelBooking(
            Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest request,
            [Header("Authorization")] string cookie);

        [Put("/shared-services/booking/vouchers-paymentflow/redeem")]
        Task<ApiResponse<List<CreditSpend>>> Redeem(
            easyJet.Holidays.Api.Domain.Data.SharedServices.Booking.RedeemRequest request,
            [Header("Authorization")] string cookie);
    }
}
