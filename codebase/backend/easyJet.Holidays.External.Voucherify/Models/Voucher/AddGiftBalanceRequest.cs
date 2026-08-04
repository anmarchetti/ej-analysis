using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class AddGiftBalanceRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.VoucherAddGiftBalance>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
