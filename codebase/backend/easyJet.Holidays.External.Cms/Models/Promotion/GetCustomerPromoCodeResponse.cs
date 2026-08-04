using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Promotion
{
    public class GetCustomerPromoCodeResponse : JsonApiResponse<string>
    {
        public override ApiError[] ApiErrors => null;
    }
}
