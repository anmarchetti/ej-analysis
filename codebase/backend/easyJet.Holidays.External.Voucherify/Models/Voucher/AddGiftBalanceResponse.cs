using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class AddGiftBalanceResponse : VJsonApiResponse<VVoucherify.DataModel.Balance>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
