using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Voucherify.Api;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherGetResponse : VJsonApiResponse<Holidays.Api.Domain.Data.Vouchers.Voucher>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}