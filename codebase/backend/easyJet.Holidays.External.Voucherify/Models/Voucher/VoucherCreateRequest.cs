using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherCreateRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.VoucherCreate>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
