using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Data.MediaCenter;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.MediaCenter
{
    public class ArticlesSearchResponse : JsonApiResponse<ArticlesResponse>
    {
        public override ApiError[] ApiErrors => null;
    }
}
