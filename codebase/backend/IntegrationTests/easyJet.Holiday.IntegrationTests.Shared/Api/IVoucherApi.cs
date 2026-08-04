using easyJet.Holiday.IntegrationTests.Shared.Models.Voucher;
using Refit;

namespace easyJet.Holiday.IntegrationTests.Shared.Api;

public interface IVoucherApi
{
    [Get("/voucher/validate")]
    public Task<ApiResponse<ValidateVoucherResponse>> ValidateVoucher(string voucherCode);
}
