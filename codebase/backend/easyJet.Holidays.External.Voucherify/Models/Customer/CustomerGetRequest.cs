using easyJet.Holidays.External.Voucherify.Api;
using VVoucherify = Voucherify;

namespace easyJet.Holidays.External.Voucherify.Models
{
    public class CustomerGetRequest : VJsonApiRequest<VVoucherify.DataModel.Contexts.CustomerCreate>
    {
        public override HttpMethod Method => HttpMethod.Get;
    }
}
