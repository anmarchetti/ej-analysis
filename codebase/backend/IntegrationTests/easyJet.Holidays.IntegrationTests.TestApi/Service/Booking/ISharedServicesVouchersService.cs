using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using Voucherify.DataModel;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking
{
    public interface ISharedServicesVouchersService
    {
        Task<Customer> GetOrCreate(GetOrCreateRequest request);
        Task<string?> CreateAndPublishVoucher(CreateAndPublishVoucherRequest request);
    }
}