using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Cms.Models
{
    public class FiltersSearchRequestBody
    {
        public string[] AtcomIds { get; set; }
    }

    public class FiltersSearchRequest : JsonApiRequest<FiltersSearchRequestBody>
    {
        public override HttpMethod Method => HttpMethod.Post;
    }
}
