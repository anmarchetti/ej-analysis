using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.MediaCenter
{
    public class TopicsSearchResponse : JsonApiResponse<string[]>
    {
        public override ApiError[] ApiErrors => null;
    }
}
