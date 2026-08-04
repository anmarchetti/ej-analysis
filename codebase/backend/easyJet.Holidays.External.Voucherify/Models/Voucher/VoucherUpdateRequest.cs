using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherUpdateRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.VoucherUpdate>
    {
        public override HttpMethod Method => HttpMethod.Put;
    }
}
