using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.Vouchers;
using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models.Vouchers
{
    public class VouchersListResponse : VJsonApiResponse<VouchersList>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }

    public class VouchersList : VVoucherify.Core.DataModel.ApiListObject
    {
        public List<VoucherWithCustomer> Vouchers { get; set; }
    }
}