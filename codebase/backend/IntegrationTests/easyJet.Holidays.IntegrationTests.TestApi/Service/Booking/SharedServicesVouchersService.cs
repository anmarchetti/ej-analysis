using easyJet.Holiday.IntegrationTests.Shared.Api;
using easyJet.Holiday.IntegrationTests.Shared.Models.SharedServices;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using Microsoft.Extensions.Options;
using Voucherify.DataModel;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public class SharedServicesVouchersService(
        ISharedServicesVouchersApi sharedServicesVouchersApi,
        IOptions<SharedServicesSettings> sharedServicesSettings)
        : ISharedServicesVouchersService
    {
        private readonly SharedServicesSettings _sharedServicesSettings = sharedServicesSettings?.Value ??
                                                                          throw new ArgumentNullException(
                                                                              nameof(sharedServicesSettings));

        public async Task<Customer> GetOrCreate(GetOrCreateRequest request)
        {
            var response = await sharedServicesVouchersApi.GetOrCreate(request, _sharedServicesSettings.Key);
            return response.Content!;
        }

        public async Task<string?> CreateAndPublishVoucher(CreateAndPublishVoucherRequest request)
        {
            var response =
                await sharedServicesVouchersApi.CreateAndPublishVoucher(request, _sharedServicesSettings.Key);
            return response.Content?.Trim('"');
        }
    }
}