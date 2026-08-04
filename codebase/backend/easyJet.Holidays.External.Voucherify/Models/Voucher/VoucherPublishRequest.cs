using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherPublishRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.VoucherPublishSingle>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
