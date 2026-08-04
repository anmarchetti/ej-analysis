using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Spend
{
    public class ProcessRedemptionRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.RedemptionRedeem>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
