using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class HotelsSearchRequestBody
    {
        public string[] AtcomIds { get; set; }
    }

    public class HotelsSearchRequest : JsonApiRequest<HotelsSearchRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
