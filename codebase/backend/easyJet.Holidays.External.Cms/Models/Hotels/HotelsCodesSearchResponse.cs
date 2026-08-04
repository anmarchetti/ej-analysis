using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.Hotels
{
    public class HotelsCodesSearchResponse : JsonApiResponse<string[]>
    {
        public override ApiError[] ApiErrors => null;
    }
}
