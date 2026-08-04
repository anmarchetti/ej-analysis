using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VoucherPublishResponse : VJsonApiResponse<VVoucherify.DataModel.PublicationSingle>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
