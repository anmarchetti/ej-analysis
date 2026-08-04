using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models
{
    public class CustomerCreateResponse : VJsonApiResponse<VVoucherify.DataModel.Customer>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
