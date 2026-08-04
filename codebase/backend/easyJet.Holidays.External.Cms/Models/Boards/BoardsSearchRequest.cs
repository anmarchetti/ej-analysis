using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class BoardsSearchRequestBody : BaseByCodeRequest
    {
    }

    public class BoardsSearchRequest : JsonApiRequest<BoardsSearchRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
