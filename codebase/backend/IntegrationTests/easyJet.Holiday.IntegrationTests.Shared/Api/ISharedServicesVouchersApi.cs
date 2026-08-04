using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using Refit;
using Voucherify.DataModel;

namespace easyJet.Holiday.IntegrationTests.Shared.Api
{
    public interface ISharedServicesVouchersApi
    {
        [Get("/shared-services/vouchers/customer-repository/get-or-create")]
        Task<ApiResponse<Customer>> GetOrCreate(
            GetOrCreateRequest request,
            [Header("Authorization")] string cookie);

        [Post("/shared-services/vouchers/create-and-publish-voucher")]
        Task<ApiResponse<string?>> CreateAndPublishVoucher(
            CreateAndPublishVoucherRequest request,
            [Header("Authorization")] string sharedServiceKey);
    }
}