using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using CancelBookingRequest = easyJet.Holidays.Api.Domain.Data.SharedServices.Booking.CancelBookingRequest;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public interface ISharedServicesBookingService
    {
        Task<CancelBookingResponse> CancelBooking(CancelBookingRequest request);

        Task<List<CreditSpend>> Redeem(RedeemRequest request);
    }
}