using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Spend
{
    public class RollbackRedemptionResponse : VJsonApiResponse<VVoucherify.DataModel.RedemptionRollback>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
