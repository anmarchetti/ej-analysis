using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.External.Voucherify.Api;

namespace easyJet.Holidays.External.Voucherify.Models.Spend
{
    public class ProcessRedemptionResponse : VJsonApiResponse<Redemption>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
