using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Feefo.Models.EnterSale
{
    public class FeefoEnterSaleResponse : JsonApiResponse<object>
    {
        public override ApiError[] ApiErrors => null; // Don't handle response body errors
    }
}
