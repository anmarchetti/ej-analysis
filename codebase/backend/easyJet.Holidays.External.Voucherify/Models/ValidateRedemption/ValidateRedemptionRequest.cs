using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.ValidateRedemption
{
    public class ValidateRedemptionRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.Validation>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
