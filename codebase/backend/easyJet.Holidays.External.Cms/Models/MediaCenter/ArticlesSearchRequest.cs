using easyJet.Holidays.Api.Domain.Data.MediaCenter;
using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models.MediaCenter
{
    public class ArticlesSearchRequest : JsonApiRequest<ArticlesRequest>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
