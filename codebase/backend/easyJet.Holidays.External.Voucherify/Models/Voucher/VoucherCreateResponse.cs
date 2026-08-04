using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.External.Voucherify.Api;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherCreateResponse : VJsonApiResponse<Voucher>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
