using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.SharedServices;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Booking;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public class SharedServicesBookingService : ISharedServicesBookingService
    {
        private readonly ISharedServicesBookingApi _sharedServicesBookingApi;
        private readonly SharedServicesSettings _sharedServicesSettings;

        public SharedServicesBookingService(
            ISharedServicesBookingApi sharedServicesBookingApi,
            IOptions<SharedServicesSettings> sharedServicesSettings)
        {
            _sharedServicesBookingApi = sharedServicesBookingApi;
            _sharedServicesSettings = sharedServicesSettings?.Value ?? throw new ArgumentNullException(nameof(sharedServicesSettings));
        }

        public async Task<CancelBookingResponse> CancelBooking(Api.Domain.Data.SharedServices.Booking.CancelBookingRequest request)
        {
            var response = await _sharedServicesBookingApi.CancelBooking(request, _sharedServicesSettings.Key);
            return new CancelBookingResponse { BookingResponse = response.Content };
        }

        public async Task<List<CreditSpend>> Redeem(RedeemRequest request)
        {
            var response = await _sharedServicesBookingApi.Redeem(request, _sharedServicesSettings.Key);
            return response.Content ?? new List<CreditSpend>();
        }
    }
}
